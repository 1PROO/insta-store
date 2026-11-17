import { describe, expect, it } from 'vitest';
import { getAppStatus } from '../src/lib/health';

describe('health check', () => {
	it('reports healthy service metadata', () => {
		expect(getAppStatus()).toEqual({ ok: true, service: 'insta-store' });
	});
});
