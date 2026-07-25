import { createClient } from "npm:@supabase/supabase-js@2";

const PHOTOS_BUCKET = "workout-photos";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Client scopé à l'utilisateur appelant, pour vérifier son identité à partir de son propre token.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Session invalide" }), { status: 401 });
  }

  // Client admin (clé service_role, jamais exposée au client mobile) pour la suppression réelle.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: files } = await adminClient.storage.from(PHOTOS_BUCKET).list(user.id);
  if (files && files.length > 0) {
    const paths = files.map((file) => `${user.id}/${file.name}`);
    await adminClient.storage.from(PHOTOS_BUCKET).remove(paths);
  }

  // Supprime le compte auth ; profiles/workouts/workout_sets suivent via "on delete cascade".
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
