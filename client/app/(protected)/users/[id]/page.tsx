'use client';

import { useParams } from 'next/navigation';
import { UserProfileWrapper } from './UserProfileWrapper';
import { UserProfileInitializer } from './UserProfileInitializer';

export default function UserProfilePage() {
  const { id } = useParams();
  const userId = parseInt(id as string);

  return (
    <UserProfileWrapper initialPosts={[]} userId={userId}>
      <UserProfileInitializer userId={userId} />
    </UserProfileWrapper>
  );
}
