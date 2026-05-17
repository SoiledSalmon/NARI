import React from 'react';
import { Badge } from '../ui/Badge';
import { TrustedContact } from '../../data/types';

interface DeliveryBadgeProps {
  deliveryMethod: TrustedContact['deliveryMethod'];
}

export function DeliveryBadge({ deliveryMethod }: DeliveryBadgeProps) {
  if (deliveryMethod === 'nari') {
    return <Badge label="NARI" preset="nari" />;
  }

  return (
    <Badge
      label={deliveryMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'}
      preset="sms"
    />
  );
}
