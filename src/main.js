import { supabase } from './supabaseClient.js'

async function testConnection() {
  const { data, error } = await supabase.from('ledger').select('*')
  if (error) console.error(error)
  else console.log(data)
}

testConnection()
