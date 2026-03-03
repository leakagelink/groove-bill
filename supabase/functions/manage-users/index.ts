import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authorized" }), { status: 401, headers });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: callerError } = await adminClient.auth.getUser(token);
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers });
    }

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create_user") {
      const { email, password, full_name, role } = body;
      if (!email || !password || !role) {
        return new Response(JSON.stringify({ error: "Email, password and role required" }), { status: 400, headers });
      }

      // Create user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || "" },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers });
      }

      // Assign role
      const { error: roleError } = await adminClient
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role });

      if (roleError) {
        return new Response(JSON.stringify({ error: roleError.message }), { status: 400, headers });
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), { headers });
    }

    if (action === "list_users") {
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) {
        return new Response(JSON.stringify({ error: listError.message }), { status: 400, headers });
      }

      // Get all roles
      const { data: roles } = await adminClient.from("user_roles").select("*");

      const result = users.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || "",
        created_at: u.created_at,
        role: roles?.find((r) => r.user_id === u.id)?.role || "no_role",
      }));

      return new Response(JSON.stringify({ users: result }), { headers });
    }

    if (action === "update_role") {
      const { user_id, role } = body;
      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: "user_id and role required" }), { status: 400, headers });
      }

      // Upsert role
      const { data: existing } = await adminClient
        .from("user_roles")
        .select("id")
        .eq("user_id", user_id)
        .single();

      if (existing) {
        const { error } = await adminClient
          .from("user_roles")
          .update({ role })
          .eq("user_id", user_id);
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });
      } else {
        const { error } = await adminClient
          .from("user_roles")
          .insert({ user_id, role });
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });
      }

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (action === "delete_user") {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers });
      }
      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: "Cannot delete yourself" }), { status: 400, headers });
      }

      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (action === "reset_password") {
      const { user_id, password } = body;
      if (!user_id || !password) {
        return new Response(JSON.stringify({ error: "user_id and password required" }), { status: 400, headers });
      }

      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
});
