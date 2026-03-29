import { DataProvider, fetchUtils, HttpError } from 'react-admin';
import { getValidAccessToken } from './auth/keycloak';
import { env } from './config/env';

const apiUrl = env.apiUrl;

/** HTTP status from fetch / react-admin error objects (avoid coupling the client to Nest). */
type HttpStatusCode = number;

/** JSON body shape returned by ApiExceptionFilter (and compatible Nest errors). */
type ApiErrorBody = {
  message?: string | string[];
  code?: string;
  details?: unknown;
};

/** Shape thrown by fetchUtils.fetchJson on non-2xx responses. */
type FetchJsonError = {
  status?: HttpStatusCode;
  body?: ApiErrorBody;
  message?: string;
};

function userMessageFromApiBody(
  body: ApiErrorBody | undefined,
  fallback: string,
): string {
  const raw = body?.message;
  if (Array.isArray(raw)) return raw.join('\n');
  if (typeof raw === 'string') return raw;
  return fallback;
}

const httpClient = async (url: string, options: fetchUtils.Options = {}) => {
  const token = await getValidAccessToken();
  const headers = new Headers(options.headers ?? { Accept: 'application/json' });
  headers.set('Authorization', `Bearer ${token}`);

  try {
    return await fetchUtils.fetchJson(url, {
      ...options,
      headers,
    });
  } catch (error: unknown) {
    const fetchError = error as FetchJsonError;
    const fromPayload = userMessageFromApiBody(fetchError.body, '');
    const fallbackMessage = fetchError.message || 'Request failed';

    throw new HttpError(
      fromPayload || fallbackMessage,
      fetchError.status ?? 500,
      fetchError.body,
    );
  }
};

function buildQueryString(query: Record<string, unknown>) {
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, val]) => {
    if (val === undefined || val === null || val === '') return;
    if (Array.isArray(val)) {
      val.forEach((v) => {
        if (v === undefined || v === null || v === '') return;
        search.append(key, String(v));
      });
      return;
    }
    search.set(key, String(val));
  });
  return search.toString();
}

const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination!;
    const { field, order } = params.sort!;
    const start = (page - 1) * perPage;
    const end = page * perPage;

    const query: Record<string, unknown> = {
      _start: start,
      _end: end,
      _sort: field,
      _order: order,
      ...(params.filter ?? {}),
    };

    const queryString = buildQueryString(query);
    const url = `${apiUrl}/${resource}?${queryString}`;
    const { json, headers } = await httpClient(url);

    const contentRange = headers.get('Content-Range');
    const total = contentRange
      ? parseInt(contentRange.split('/').pop() || '0', 10)
      : json.length;

    return { data: json, total };
  },

  getOne: async (resource, params) => {
    const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`);
    return { data: json };
  },

  getMany: async (resource, params) => {
    const query = params.ids.map((id) => `id=${id}`).join('&');
    const { json } = await httpClient(`${apiUrl}/${resource}?${query}`);
    return { data: json };
  },

  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination!;
    const { field, order } = params.sort!;
    const start = (page - 1) * perPage;
    const end = page * perPage;

    const query: Record<string, unknown> = {
      _start: start,
      _end: end,
      _sort: field,
      _order: order,
      [params.target]: params.id,
      ...(params.filter ?? {}),
    };

    const queryString = buildQueryString(query);
    const url = `${apiUrl}/${resource}?${queryString}`;
    const { json, headers } = await httpClient(url);

    const contentRange = headers.get('Content-Range');
    const total = contentRange
      ? parseInt(contentRange.split('/').pop() || '0', 10)
      : json.length;

    return { data: json, total };
  },

  create: async (resource, params) => {
    const { json } = await httpClient(`${apiUrl}/${resource}`, {
      method: 'POST',
      body: JSON.stringify(params.data),
    });
    return { data: json };
  },

  update: async (resource, params) => {
    const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(params.data),
    });
    return { data: json };
  },

  updateMany: async (resource, params) => {
    const responses = await Promise.all(
      params.ids.map((id) =>
        httpClient(`${apiUrl}/${resource}/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(params.data),
        })
      )
    );
    return { data: responses.map(({ json }) => json.id) };
  },

  delete: async (resource, params) => {
    const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: 'DELETE',
    });
    return { data: json };
  },

  deleteMany: async (resource, params) => {
    const responses = await Promise.all(
      params.ids.map((id) =>
        httpClient(`${apiUrl}/${resource}/${id}`, {
          method: 'DELETE',
        })
      )
    );
    return { data: responses.map(({ json }) => json.id) };
  },
};

export default dataProvider;
