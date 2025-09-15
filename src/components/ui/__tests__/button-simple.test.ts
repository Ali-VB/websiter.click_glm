// Simple test without JSX to verify Jest setup is working
describe('Button Simple Test', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});