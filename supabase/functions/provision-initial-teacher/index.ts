// The initial invitation has already been sent through a short-lived trusted bootstrap.
// This deployed tombstone cannot create users or grant permissions.
Deno.serve(()=>new Response('Initial teacher invitation completed. Provisioning is disabled.',{status:410}))
