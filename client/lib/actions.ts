'use server'
 
import { revalidateTag } from 'next/cache'
 
export async function revalidatePostsFeed() {
  revalidateTag('posts-feed', 'max')
}
