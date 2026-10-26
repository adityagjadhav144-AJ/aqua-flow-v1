import { Pool, PoolMember, BookingPrice } from '../types';
import { calculatePrice } from './pricing';

export function calculatePoolSplits(
  pool: Pool,
  demandIndex: number,
  distanceKm = 5.0
): { members: PoolMember[]; totalPrice: BookingPrice } {
  const committedLitres = pool.members.reduce((acc, m) => acc + m.litres, 0);
  const householdCount = pool.members.length;

  // Calculate overall pool price using combined volume and household discount
  const totalPrice = calculatePrice({
    volumeL: committedLitres,
    purpose: 'general',
    distanceKm,
    slotType: 'standard',
    demandIndex,
    householdCount,
  });

  // Calculate proportional share per member
  const updatedMembers = pool.members.map((member) => {
    const fraction = committedLitres > 0 ? member.litres / committedLitres : 0;
    const sharePaise = Math.round(totalPrice.total * fraction);
    return {
      ...member,
      sharePaise,
    };
  });

  return {
    members: updatedMembers,
    totalPrice,
  };
}

export function generateWhatsAppShareLink(pool: Pool, appUrl = window.location.origin): string {
  const committed = pool.members.reduce((acc, m) => acc + m.litres, 0);
  const remaining = Math.max(0, pool.targetL - committed);
  const text = encodeURIComponent(
    `🚰 *AquaFlow Pune Community Water Pool*\n\n` +
    `Join our neighbourhood tanker pool at *${pool.dropPoint.label}* to get volume discounts up to 12%!\n\n` +
    `• Target: ${pool.targetL.toLocaleString('en-IN')} L\n` +
    `• Current: ${committed.toLocaleString('en-IN')} L (${pool.members.length} households)\n` +
    `• Remaining: ${remaining.toLocaleString('en-IN')} L\n\n` +
    `Tap here to join our pool: ${appUrl}#pool-${pool.id}`
  );
  return `https://wa.me/?text=${text}`;
}
