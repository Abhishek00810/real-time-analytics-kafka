import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<200'],
  },
};

export default function () {
  const url = 'http://localhost:8081/analytics/events';
  
  const payload = JSON.stringify({
    user_id: 'user_456',
    page_url: 'https://example.com/home'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Use the generic http.request() function for full control
  const response = http.request(
    'GET',    // Method
    url,      // URL
    payload,  // Body/Payload
    params    // Parameters (including headers)
  );
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response includes count': (r) => r.json('count') >= 0,
  });
}