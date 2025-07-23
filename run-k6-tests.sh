#!/bin/bash
for i in {1..3}
do
  echo "👉 Running test on container: k6-$i"
  docker exec -d nestjs-upload-image-k6-$i k6 run /mnt/k6-test/upload-image-test.js
done
