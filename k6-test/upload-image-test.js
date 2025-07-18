import http from 'k6/http';
import { check } from 'k6';

const fileBin = open('./image.png', 'b');

export const options = {
  vus: 500,
  duration: '3s',
};

export default function () {
  const data = {
    file: http.file(fileBin, 'image.png', 'image/png'),
  };

  const res = http.post('http://nest-api:3000/upload', data);

  check(res, {
    'status is 201': (r) => r.status === 201,
    'upload took < 1000ms': (r) => r.timings.duration < 1000,
  });
}
