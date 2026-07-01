import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './errors';
import { ApiError } from '../api/client';

describe('getErrorMessage', () => {
  it('maps 400 to an invalid-request message including the server detail', () => {
    const err = new ApiError(400, { message: 'startDate is required' });
    expect(getErrorMessage(err)).toBe('Invalid request: startDate is required');
  });

  it('maps 404 to a not-found message', () => {
    expect(getErrorMessage(new ApiError(404, { message: 'nope' }))).toBe('Resource not found');
  });

  it('maps 503 to a service-unavailable message', () => {
    expect(getErrorMessage(new ApiError(503, { message: 'down' })))
      .toBe('Service unavailable — database may be down');
  });

  it('falls back to the server message for other statuses', () => {
    expect(getErrorMessage(new ApiError(418, { message: 'teapot' }))).toBe('teapot');
  });

  it('uses a status-coded fallback when the server message is empty', () => {
    expect(getErrorMessage(new ApiError(500, { message: '' }))).toBe('Unexpected error (500)');
  });

  it('detects a network/fetch failure', () => {
    const err = new TypeError('Failed to fetch');
    expect(getErrorMessage(err)).toContain('Cannot reach Insights Service');
  });

  it('returns a generic message for unknown errors', () => {
    expect(getErrorMessage('something odd')).toBe('An unexpected error occurred');
  });
});
