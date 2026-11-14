// The real Blobs (MIN-4475): Supabase Storage through the service client. Buckets are private and the
// restrictive policy 000 closes them to every client role; only signed links, minted here, open a file.
import { adminClient } from "./admin.ts";
import type { Auth, Blobs } from "./docs.ts";

export const blobs: Blobs = {
  async createSignedUpload(bucket, path) {
    const { data, error } = await adminClient().storage.from(bucket).createSignedUploadUrl(path);
    return error || !data ? null : { token: data.token, signed_url: data.signedUrl };
  },
  async download(bucket, path) {
    const { data, error } = await adminClient().storage.from(bucket).download(path);
    return error || !data ? null : new Uint8Array(await data.arrayBuffer());
  },
  async remove(bucket, path) {
    await adminClient().storage.from(bucket).remove([path]);
  },
  async signedUrl(bucket, path, seconds) {
    const { data, error } = await adminClient().storage.from(bucket).createSignedUrl(path, seconds);
    return error || !data ? null : data.signedUrl;
  },
};

export const auth: Auth = {
  async verify(token) {
    const { data, error } = await adminClient().auth.getUser(token);
    return error || !data.user ? null : data.user.id;
  },
};
