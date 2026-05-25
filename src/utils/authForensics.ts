import { supabase } from "@/integrations/supabase/client";
import { forensicLog } from "./processForensics";

export const getAuthTraceId = () => `AUTH_TRACE_${Math.random().toString(36).substring(7).toUpperCase()}`;

export const captureAuthError = (error: any, traceId: string) => {
    console.log(`[AUTH_REQUEST_FAIL] TraceId: ${traceId}`);
    forensicLog('AUTH_ERROR', {
        traceId,
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause,
        constructorName: error?.constructor?.name,
        stringified: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
};

export const wrappedSignInWithPassword = async (params: any) => {
    const traceId = getAuthTraceId();
    console.log(`[AUTH_REQUEST_START] signInWithPassword TraceId: ${traceId}`);
    forensicLog('AUTH_START', { traceId, method: 'signInWithPassword', email: params.email });
    
    try {
        const result = await supabase.auth.signInWithPassword(params);
        if (result.error) {
            captureAuthError(result.error, traceId);
        } else {
            console.log(`[AUTH_REQUEST_END] signInWithPassword TraceId: ${traceId}`);
            forensicLog('AUTH_SUCCESS', { traceId, method: 'signInWithPassword' });
        }
        return result;
    } catch (err: any) {
        captureAuthError(err, traceId);
        throw err;
    }
};

export const wrappedSignUp = async (params: any) => {
    const traceId = getAuthTraceId();
    console.log(`[AUTH_REQUEST_START] signUp TraceId: ${traceId}`);
    forensicLog('AUTH_START', { traceId, method: 'signUp', email: params.email });
    
    try {
        const result = await supabase.auth.signUp(params);
        if (result.error) {
            captureAuthError(result.error, traceId);
        } else {
            console.log(`[AUTH_REQUEST_END] signUp TraceId: ${traceId}`);
            forensicLog('AUTH_SUCCESS', { traceId, method: 'signUp' });
        }
        return result;
    } catch (err: any) {
        captureAuthError(err, traceId);
        throw err;
    }
};
