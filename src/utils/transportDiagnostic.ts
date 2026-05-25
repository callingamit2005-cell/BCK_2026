/**
 * 🧪 ISOLATED TRANSPORT DIAGNOSTIC
 * 
 * Strictly for isolating "Failed to fetch" on Android.
 * Tests general HTTPS connectivity vs Supabase-specific connectivity.
 */

export const runTransportDiagnostic = async () => {
    console.log("🧪 [DIAGNOSTIC] Starting Transport Audit...");

    const testEndpoint = async (name: string, url: string) => {
        const start = performance.now();
        console.log(`🧪 [DIAGNOSTIC_START] ${name}: ${url}`);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const duration = (performance.now() - start).toFixed(2);
            const text = await response.text();
            
            console.log(`✅ [DIAGNOSTIC_SUCCESS] ${name}`, {
                status: response.status,
                statusText: response.statusText,
                duration: `${duration}ms`,
                contentLength: text.length,
                type: response.type
            });
        } catch (err: any) {
            const duration = (performance.now() - start).toFixed(2);
            console.error(`❌ [DIAGNOSTIC_FAIL] ${name} after ${duration}ms`, {
                message: err.message,
                name: err.name,
                stack: err.stack
            });
        }
    };

    // 1. Test Generic HTTPS (Known stable public API)
    await testEndpoint("GENERIC_HTTPS", "https://jsonplaceholder.typicode.com/posts/1");

    // 2. Test Supabase Specific (REST endpoint)
    await testEndpoint("SUPABASE_HTTPS", "https://cbagjjhzsaxrzmulacxf.supabase.co/rest/v1/");
    
    console.log("🧪 [DIAGNOSTIC] Audit Complete.");
};
