// Canonical host: 301 www.arqamrashed.com -> arqamrashed.com so Google indexes one origin only.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'www.arqamrashed.com') {
    url.hostname = 'arqamrashed.com';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
