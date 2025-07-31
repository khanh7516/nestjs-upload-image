import http from 'k6/http';
import { check } from 'k6';

const fileBin = open('./image_4mb.png', 'b');

export const options = {
  vus: 10,
  duration: '10s',
};

export default function () {
  const data = {
    file: http.file(fileBin, 'image_4mb.png', 'image/png'),
  };

  const res = http.post('http://nest-api:3000/upload', data);

  check(res, {
    'status is 201': (r) => r.status === 201,
    'upload took < 1000ms': (r) => r.timings.duration < 1000,
  });
}
