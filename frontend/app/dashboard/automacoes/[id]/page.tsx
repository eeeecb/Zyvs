'use client';

import { useParams } from 'next/navigation';
import { FlowEditor } from '../components/editor/FlowEditor';

export default function EditFlowPage() {
  const params = useParams();
  const flowId = params.id as string;

  return <FlowEditor flowId={flowId} />;
}
