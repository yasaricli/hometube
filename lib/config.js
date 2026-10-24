function need(name) {
  const value = process.env[name];
  if (!value) throw new Error(`missing env ${name}`);
  return value;
}

export const MONGODB_URI = need("MONGODB_URI");
export const PORT = Number(need("PORT"));
export const MEDIA_DIR = need("MEDIA_DIR");
