const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
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

  let payload;
  try {
    payload = await readJson(req);
  } catch (_) {
    return json(res, 400, { error: 'JSON invalido.' });
  }

  const nome = String(payload?.nome || '').trim();
  const email = String(payload?.email || '').trim().toLowerCase();
  const perfil = String(payload?.perfil || '').trim();
  const escola = String(payload?.escola || '').trim();
  const senha = String(payload?.senha || '');

  if (!nome || !email || !perfil || !senha) {
    return json(res, 400, { error: 'Preencha todos os campos obrigatorios.' });
  }

  if (senha.length < 6) {
    return json(res, 400, { error: 'A senha deve ter no minimo 6 caracteres.' });
  }

  const userResp = await supabaseFetch('/auth/v1/user', {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`
    }
  });

  if (!userResp.resp.ok || !userResp.body?.id) {
    return json(res, 401, { error: 'Sessao expirada ou invalida.' });
  }

  const perfilResp = await supabaseFetch(`/rest/v1/perfis?select=id,perfil,ativo&id=eq.${userResp.body.id}`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  const perfilAtual = Array.isArray(perfilResp.body) ? perfilResp.body[0] : null;
  if (!perfilResp.resp.ok || !perfilAtual) {
    return json(res, 403, { error: 'Seu perfil nao tem permissao para criar usuarios.' });
  }

  if (perfilAtual.perfil !== 'diretora' || perfilAtual.ativo === false) {
    return json(res, 403, { error: 'Apenas diretoras ativas podem criar usuarios.' });
  }

  const createResp = await supabaseFetch('/auth/v1/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome,
        perfil,
        escola: escola || null
      }
    })
  });

  if (!createResp.resp.ok || !createResp.body?.user?.id) {
    const message = createResp.body?.msg || createResp.body?.message || createResp.body?.error_description || createResp.body?.error;
    return json(res, createResp.resp.status || 400, {
      error: message || 'Falha ao criar usuario no Supabase.'
    });
  }

  const novoUsuarioId = createResp.body.user.id;
  const perfilInsertResp = await supabaseFetch('/rest/v1/perfis?on_conflict=id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      id: novoUsuarioId,
      nome,
      email,
      perfil,
      escola: escola || null,
      ativo: true
    })
  });

  if (!perfilInsertResp.resp.ok) {
    const message = perfilInsertResp.body?.message || perfilInsertResp.body?.error || 'Usuario criado, mas nao consegui sincronizar a tabela de perfis.';
    return json(res, 500, { error: message });
  }

  return json(res, 200, {
    ok: true,
    user: {
      id: novoUsuarioId,
      email,
      nome,
      perfil
    }
  });
};
