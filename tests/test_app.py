"""Regression tests for the retained Flask routes and public legacy API."""
import unittest

from app import app


class FlaskAppTests(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_planner_and_laboratory_routes(self):
        self.assertEqual(self.client.get('/').status_code, 200)
        lab = self.client.get('/laboratorio')
        self.assertEqual(lab.status_code, 200)
        self.assertIn(b'laboratorio.js', lab.data)
        self.assertIn(b'laboratorio.css', lab.data)

    def test_default_calculation_is_backward_compatible(self):
        response = self.client.post('/api/calculate', json={})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['utility'], 100)
        self.assertEqual(len(data['curves']['temperature']['labels']), 41)
        self.assertEqual(len(data['curves']['time']['labels']), 39)
        self.assertEqual(len(data['curves']['turns']['labels']), 10)

    def test_artisanal_optimum(self):
        response = self.client.post('/api/calculate', json={'type': 'Artisanal'})
        self.assertEqual(response.get_json()['utility'], 150)

    def test_invalid_json_is_json_error(self):
        for payload in ('{broken', 'null', '[]', '"hello"'):
            with self.subTest(payload=payload):
                response = self.client.post(
                    '/api/calculate', data=payload, content_type='application/json'
                )
                self.assertEqual(response.status_code, 400)
                self.assertIn('error', response.get_json())

    def test_invalid_numbers_and_enumerations(self):
        payloads = [
            {'temperature': 'NaN'}, {'temperature': 'Infinity'},
            {'temperature': 99}, {'temperature': 301},
            {'temperature': None}, {'temperature': True},
            {'temperature': []}, {'temperature': {}},
            {'time': 0}, {'time': 21}, {'time': 'abc'},
            {'turns': 1.5}, {'turns': '1.5'}, {'turns': 0}, {'turns': 11},
            {'type': 'unknown'}, {'type': []}, {'salting': {}},
            {'salting': 'unknown'},
        ]
        for payload in payloads:
            with self.subTest(payload=payload):
                response = self.client.post('/api/calculate', json=payload)
                self.assertEqual(response.status_code, 400)
                self.assertIn('error', response.get_json())

    def test_numeric_strings_remain_supported(self):
        response = self.client.post('/api/calculate', json={
            'temperature': '200', 'time': '8', 'turns': '1',
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['utility'], 100)


if __name__ == '__main__':
    unittest.main()
