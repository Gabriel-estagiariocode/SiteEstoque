const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function supabaseFetch(path, options = {}) {
  const resp = await fetch(`${SUPABASE_URL}${path}`, options);
  const text = await resp.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch (_) {
    body = text || null;
  }

  return { resp, body };
}

async function getAdminPerfil(token) {
  const userResp = await supabaseFetch('/auth/v1/user', {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`
    }
  });

  if (!userResp.resp.ok || !userResp.body?.id) {
    return { error: 'Sessao expirada ou invalida.', status: 401 };
  }

  const perfilResp = await supabaseFetch(`/rest/v1/perfis?select=id,perfil,ativo&id=eq.${userResp.body.id}`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  const perfil = Array.isArray(perfilResp.body) ? perfilResp.body[0] : null;
  if (!perfilResp.resp.ok || !perfil) {
    return { error: 'Seu perfil nao tem permissao para gerenciar usuarios.', status: 403 };
  }

  if (!['administrador', 'diretora'].includes(perfil.perfil) || perfil.ativo === false) {
    return { error: 'Apenas administradores e nivel 1 ativos podem gerenciar usuarios.', status: 403 };
  }

  return { perfil };
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Metodo nao permitido.' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    return json(res, 500, {
      error: 'Configuracao ausente no servidor. Defina SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.'
    });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return json(res, 401, { error: 'Sessao invalida.' });
  }

  const adminCheck = await getAdminPerfil(token);
  if (adminCheck.error) {
    return json(res, adminCheck.status, { error: adminCheck.error });
  }

  const usersResp = await supabaseFetch('/rest/v1/perfis?select=*&order=criado_em.asc', {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  if (!usersResp.resp.ok) {
    const message = usersResp.body?.message || usersResp.body?.error || 'Falha ao carregar usuarios.';
    return json(res, 500, { error: message });
  }

  return json(res, 200, { users: Array.isArray(usersResp.body) ? usersResp.body : [] });
};
