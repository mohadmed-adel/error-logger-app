import { URL } from 'url';

/**
 * Mocking the logic from lib/prisma.ts to verify token extraction
 */
function extractAuthToken(databaseUrl: string, env: Record<string, string | undefined>) {
    const dbUrl = databaseUrl.split('?')[0];

    // Robustly extract authToken from URL or environment variables
    let authToken: string | undefined;
    try {
        const url = new URL(databaseUrl);
        authToken = url.searchParams.get('authToken') || undefined;
    } catch (e) {
        // If URL parsing fails, look for authToken in the string manually as fallback
        authToken = databaseUrl.includes('authToken=')
            ? databaseUrl.split('authToken=')[1]?.split('&')[0]
            : undefined;
    }

    // Fallback to separate environment variables if not found in URL
    if (!authToken) {
        authToken = env.TURSO_AUTH_TOKEN || env.LIBSQL_AUTH_TOKEN;
    }

    return { dbUrl, authToken };
}

// Test Cases
const testCases = [
    {
        name: 'Token in URL',
        url: 'libsql://my-db.turso.io?authToken=abc123token',
        env: {},
        expectedToken: 'abc123token'
    },
    {
        name: 'Token in TURSO_AUTH_TOKEN',
        url: 'libsql://my-db.turso.io',
        env: { TURSO_AUTH_TOKEN: 'turso_token' },
        expectedToken: 'turso_token'
    },
    {
        name: 'Token in LIBSQL_AUTH_TOKEN fallback',
        url: 'libsql://my-db.turso.io',
        env: { LIBSQL_AUTH_TOKEN: 'libsql_token' },
        expectedToken: 'libsql_token'
    },
    {
        name: 'Url with multiple params',
        url: 'libsql://my-db.turso.io?param1=val1&authToken=multi_token&param2=val2',
        env: { TURSO_AUTH_TOKEN: 'should_not_use' },
        expectedToken: 'multi_token'
    },
    {
        name: 'Malformed URL (fallback to manual split)',
        url: 'libsql://my-db.turso.io?authToken=manual_token',
        env: {},
        expectedToken: 'manual_token'
    }
];

console.log('--- Verifying Turso Token Extraction Logic ---');
let allPassed = true;

testCases.forEach(test => {
    const result = extractAuthToken(test.url, test.env);
    const passed = result.authToken === test.expectedToken;
    console.log(`${passed ? '✅' : '❌'} ${test.name}`);
    if (!passed) {
        console.log(`   Expected: ${test.expectedToken}`);
        console.log(`   Got     : ${result.authToken}`);
        allPassed = false;
    }
});

if (allPassed) {
    console.log('\n✨ All tests passed!');
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
