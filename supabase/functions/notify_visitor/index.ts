import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const record = body.record || body;

    const visitorName = record.visitor_name;
    const empId = record.person_to_meet;
    const purpose = record.purpose_of_visit || 'General Visit';

    if (!visitorName || !empId) {
      throw new Error("Missing required parameters: visitor_name or person_to_meet")
    }

    // Initialize Supabase Client to fetch Employee details
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Ensure empId is treated as a string for comparison if the db column is text
    const searchId = String(empId);

    // Fetch the employee's details from the users table using the correct column names
    const { data: employeeData, error: dbError } = await supabaseClient
      .from('users')
      .select('full_name, phone_number')
      .eq('emp_id', searchId)
      .single()

    if (dbError || !employeeData) {
      throw new Error(`Failed to fetch employee details for emp_id: ${searchId}. DB Error: ${dbError ? dbError.message : 'No data found'}`)
    }

    // Try to find the phone number from common column names, or fallback to HR
    const hostPhone = employeeData.phone_number || "919109164455";
    const hostName = employeeData.full_name;

    // Meta WhatsApp Config
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_ID')
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')

    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      throw new Error("WhatsApp environment variables are not set")
    }

    const payload = {
      messaging_product: "whatsapp",
      to: hostPhone,
      type: "template",
      template: {
        name: "visitor_arrival_notify", // The new template name you must create in Meta
        language: {
          code: "en"
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: hostName // Variable 1: Employee Name
              },
              {
                type: "text",
                text: visitorName // Variable 2: Visitor Name
              },
              {
                type: "text",
                text: purpose // Variable 3: Purpose of Visit
              }
            ]
          }
        ]
      }
    }

    const response = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json()

    if (!response.ok) {
      console.error("WhatsApp API Error:", responseData)
      throw new Error(JSON.stringify(responseData))
    }

    return new Response(
      JSON.stringify({ success: true, message: `WhatsApp notification sent to ${hostName}!` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Function Error:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
