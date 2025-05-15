const { createClient } = require('@supabase/supabase-js')
// import { Database } from './database.types'

require('dotenv').config();
// Create a single supabase client for interacting with your database
const supabase = createClient
    // <Database>
    (
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    )

module.exports = supabase;