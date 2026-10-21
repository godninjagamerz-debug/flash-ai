import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AccountAction = "disable" | "enable" | "delete";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

async function sendActionEmail(email: string, action: "disabled" | "deleted", reason: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const sender = Deno.env.get("ACCOUNT_EMAIL_FROM");
  if (!apiKey || !sender) return { sent: false, error: "Email delivery is not configured." };

  const actionText = action === "disabled" ? "disabled" : "deleted";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        from: sender,
        to: [email],
        subject: `Your Flash AI account has been ${actionText}`,
        text: `Your Flash AI account has been ${actionText}.\n\nReason provided by the administrator:\n${reason}\n\nIf you believe this was a mistake, contact support.`,
        html: `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#17202a"><h1>Flash AI account update</h1><p>Your account has been <strong>${actionText}</strong>.</p><h2>Reason</h2><p style="white-space:pre-wrap">${escapeHtml(reason)}</p><p>If you believe this was a mistake, contact support.</p></main>`,
      }),
    });

    if (!response.ok) {
      return { sent: false, error: `Email provider returned ${response.status}.` };
    }
    return { sent: true, error: null };
  } catch {
    return { sent: false, error: "Email delivery timed out or the provider could not be reached." };
  }
}

serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ success: false, error: "Server configuration is incomplete." }, 500);
  }

  let body: { action?: AccountAction; userId?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid request body." }, 400);
  }

  const { action, userId, reason = "" } = body;
  if (!action || !["disable", "enable", "delete"].includes(action) || !userId) {
    return jsonResponse({ success: false, error: "Invalid account action." }, 400);
  }
  if (action !== "enable" && !reason.trim()) {
    return jsonResponse({ success: false, error: "A reason is required." }, 400);
  }
  if (reason.length > 2000) {
    return jsonResponse({ success: false, error: "The reason must be 2,000 characters or fewer." }, 400);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData.user) {
    return jsonResponse({ success: false, error: "Authentication required." }, 401);
  }

  const { data: callerProfile, error: roleError } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", callerData.user.id)
    .maybeSingle();
  if (roleError || callerProfile?.role !== "admin") {
    return jsonResponse({ success: false, error: "Admin access required." }, 403);
  }
  if (callerData.user.id === userId) {
    return jsonResponse({ success: false, error: "You cannot disable or delete your own account." }, 400);
  }

  const { data: targetProfile, error: profileError } = await serviceClient
    .from("profiles")
    .select("id, email, username, role, is_disabled, disabled_reason, disabled_at")
    .eq("id", userId)
    .maybeSingle();
  if (profileError || !targetProfile) {
    return jsonResponse({ success: false, error: "Account not found." }, 404);
  }
  if (targetProfile.role === "admin") {
    return jsonResponse({ success: false, error: "Admin accounts cannot be changed here." }, 400);
  }

  const { data: authData } = await serviceClient.auth.admin.getUserById(userId);
  const email = targetProfile.email || authData.user?.email || null;
  let actionResult: { success?: boolean; error?: string } = { success: true };
  const loggedAction = action === "delete" ? "deleted" : action === "disable" ? "disabled" : "enabled";

  if (action === "delete") {
    const { data, error } = await callerClient.rpc("admin_delete_user_account", {
      p_user_id: userId,
      p_reason: reason.trim(),
    });
    if (error) actionResult = { success: false, error: error.message };
    else actionResult = data as { success?: boolean; error?: string };
  } else {
    const nextProfileState = {
      is_disabled: action === "disable",
      disabled_reason: action === "disable" ? reason.trim() : null,
      disabled_at: action === "disable" ? new Date().toISOString() : null,
    };
    const { error: updateError } = await serviceClient
      .from("profiles")
      .update(nextProfileState)
      .eq("id", userId);
    if (updateError) return jsonResponse({ success: false, error: updateError.message }, 500);

    const { error: authError } = await serviceClient.auth.admin.updateUserById(userId, {
      ban_duration: action === "disable" ? "876000h" : "none",
    });
    if (authError) {
      await serviceClient.from("profiles").update({
        is_disabled: targetProfile.is_disabled,
        disabled_reason: targetProfile.disabled_reason,
        disabled_at: targetProfile.disabled_at,
      }).eq("id", userId);
      actionResult = { success: false, error: authError.message };
    }

  }

  if (!actionResult.success) {
    return jsonResponse({ success: false, error: actionResult.error || "Account action failed." }, 400);
  }

  const emailResult = action === "enable"
    ? { sent: false, error: null }
    : email
      ? await sendActionEmail(email, action === "delete" ? "deleted" : "disabled", reason.trim())
      : { sent: false, error: "The account has no email address." };

  await serviceClient.from("account_action_log").insert({
    user_id: userId,
    actor_id: callerData.user.id,
    action: loggedAction,
    reason: reason.trim() || null,
    email_sent: emailResult.sent,
  });

  return jsonResponse({
    success: true,
    emailSent: emailResult.sent,
    emailError: emailResult.error,
  });
});