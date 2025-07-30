import { Injectable, BadRequestException } from '@nestjs/common';

interface FileSignature {
  signature: number[];
  extension: string[];
  mimeType: string[];
}

@Injectable()
export class FileValidationService {
  private readonly imageSignatures: FileSignature[] = [
    {
      signature: [0xff, 0xd8, 0xff], // JPEG
      extension: ['.jpg', '.jpeg'],
      mimeType: ['image/jpeg'],
    },
    {
      signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
      extension: ['.png'],
      mimeType: ['image/png'],
    },
    {
      signature: [0x47, 0x49, 0x46, 0x38], // GIF
      extension: ['.gif'],
      mimeType: ['image/gif'],
    },
    {
      signature: [0x42, 0x4d], // BMP
      extension: ['.bmp'],
      mimeType: ['image/bmp'],
    },
    {
      signature: [0x52, 0x49, 0x46, 0x46], // WEBP (starts with RIFF)
      extension: ['.webp'],
      mimeType: ['image/webp'],
    },
    {
      signature: [0x49, 0x49, 0x2a, 0x00], // TIFF (little endian)
      extension: ['.tiff', '.tif'],
      mimeType: ['image/tiff'],
    },
    {
      signature: [0x4d, 0x4d, 0x00, 0x2a], // TIFF (big endian)
      extension: ['.tiff', '.tif'],
      mimeType: ['image/tiff'],
    },
  ];

  validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    // Check MIME type first (basic check)
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Check file extension
    const fileExtension = this.getFileExtension(file.originalname);
    if (!this.isValidImageExtension(fileExtension)) {
      throw new BadRequestException(`Invalid image file extension: ${fileExtension}`);
    }

    // Check magic number (file signature) - most important check
    if (!this.hasValidImageSignature(file.buffer)) {
      throw new BadRequestException('Invalid image file format - file signature mismatch');
    }

    // Verify MIME type matches magic number
    if (!this.mimeTypeMatchesSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException('File content does not match declared MIME type');
    }

    // Additional security checks
    this.performSecurityChecks(file);
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.toLowerCase().substring(lastDot) : '';
  }

  private isValidImageExtension(extension: string): boolean {
    const validExtensions = this.imageSignatures.flatMap(sig => sig.extension);
    return validExtensions.includes(extension);
  }

  private hasValidImageSignature(buffer: Buffer): boolean {
    return this.imageSignatures.some(signature => {
      return this.matchesSignature(buffer, signature.signature);
    });
  }

  private matchesSignature(buffer: Buffer, signature: number[]): boolean {
    if (buffer.length < signature.length) {
      return false;
    }

    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false;
      }
    }

    return true;
  }

  private mimeTypeMatchesSignature(buffer: Buffer, mimeType: string): boolean {
    for (const signature of this.imageSignatures) {
      if (this.matchesSignature(buffer, signature.signature)) {
        return signature.mimeType.includes(mimeType);
      }
    }
    return false;
  }

  private performSecurityChecks(file: Express.Multer.File): void {
    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.php$/i, /\.jsp$/i, /\.asp$/i, /\.exe$/i, /\.bat$/i, /\.cmd$/i,
      /\.sh$/i, /\.ps1$/i, /\.vbs$/i, /\.js$/i, /\.html$/i, /\.htm$/i
    ];

    const hasSuspiciousExtension = suspiciousPatterns.some(pattern => 
      pattern.test(file.originalname)
    );

    if (hasSuspiciousExtension) {
      throw new BadRequestException('Suspicious file name detected');
    }

    // Check for double extensions (e.g., image.jpg.exe)
    const parts = file.originalname.split('.');
    if (parts.length > 3) { // filename.ext is normal, more than 2 dots is suspicious
      throw new BadRequestException('Multiple file extensions not allowed');
    }

    // Basic check for embedded executable code in early bytes
    const firstBytes = file.buffer.slice(0, 100);
    const suspiciousContent = [
      'MZ', // PE executable
      '#!/', // Shell script
      '<?php', // PHP code
      '<script', // JavaScript
      'PK', // ZIP/executable disguised as image
    ];

    for (const pattern of suspiciousContent) {
      if (firstBytes.toString('ascii').includes(pattern)) {
        throw new BadRequestException('Suspicious file content detected');
      }
    }
  }

  // Get detected file type information
  getFileTypeInfo(buffer: Buffer): { type: string; extension: string } | null {
    for (const signature of this.imageSignatures) {
      if (this.matchesSignature(buffer, signature.signature)) {
        return {
          type: signature.mimeType[0],
          extension: signature.extension[0],
        };
      }
    }
    return null;
  }
} 