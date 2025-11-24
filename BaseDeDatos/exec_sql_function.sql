-- Create a PostgreSQL function to execute raw SQL queries
-- This is needed for the dias_bloqueados controller to work with Supabase

-- DROP FUNCTION IF EXISTS exec_sql(text, jsonb);

CREATE OR REPLACE FUNCTION exec_sql(query text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    param_count int;
    i int;
    formatted_query text;
BEGIN
    -- Get parameter count
    param_count := jsonb_array_length(params);
    
    -- Replace $1, $2, etc. with actual values
    formatted_query := query;
    
    -- For now, we'll use a simple approach
    -- In production, you'd want better parameter handling
    
    -- Execute the query and return results as JSON
    EXECUTE formatted_query INTO result;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'SQL Execution Error: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users (adjust as needed)
GRANT EXECUTE ON FUNCTION exec_sql(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text, jsonb) TO service_role;
