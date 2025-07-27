// Quick Supabase Configuration Test
// Run this in your browser console to test your Supabase connection

console.log('🔍 Testing Supabase Configuration...')

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('📍 Supabase URL:', supabaseUrl)
console.log('🔑 Anon Key (first 20 chars):', supabaseKey?.substring(0, 20) + '...')

// Validation checks
const checks = {
  'URL exists': !!supabaseUrl,
  'URL format correct': supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.co'),
  'Key exists': !!supabaseKey,
  'Key format correct': supabaseKey?.startsWith('eyJ'),
  'Not using placeholders': !supabaseUrl?.includes('placeholder')
}

console.log('✅ Configuration Checks:')
Object.entries(checks).forEach(([check, passed]) => {
  console.log(`${passed ? '✅' : '❌'} ${check}`)
})

// Overall status
const allPassed = Object.values(checks).every(Boolean)
console.log(`\n🎯 Overall Status: ${allPassed ? '✅ READY' : '❌ NEEDS CONFIGURATION'}`)

if (!allPassed) {
  console.log('\n📋 Next Steps:')
  console.log('1. Go to https://app.supabase.com')
  console.log('2. Open your "scheme_saathi_Project"')
  console.log('3. Go to Settings → API')
  console.log('4. Copy your Project URL and Anon Key')
  console.log('5. Update your .env.local file')
  console.log('6. Restart your dev server')
}

export default 'Run this script to test your Supabase configuration'
