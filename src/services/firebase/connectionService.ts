import { onValue, ref } from 'firebase/database';
import { getDb } from './firebaseConfig';

export type LinkStatus = 'connecting' | 'connected' | 'disconnected';

export function subscribeLink(onStatus: (status: LinkStatus) => void): () => void {
  return onValue(ref(getDb(), '.info/connected'), (snapshot) => {
    onStatus(snapshot.val() === true ? 'connected' : 'disconnected');
  });
}
