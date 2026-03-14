'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { REGISTRY_BASE_URL, USE_FIXTURES } from '@/lib/config';
import type { FeedEntry, ActivityFeedResponse } from '@/lib/api/registry';
import { registryKeys } from '@/lib/queries/registry';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface WebSocketFilters {
  entry_types?: string[];
  actor_did?: string;
  package?: string;
}

interface FeedEntryMessage {
  type: 'feed_entry';
  log_sequence: number;
  entry_type: string;
  actor_did: string;
  summary: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
  merkle_included: boolean;
  is_genesis_phase: boolean;
}

function isFeedEntryMessage(data: unknown): data is FeedEntryMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>).type === 'feed_entry'
  );
}

/**
 * WebSocket hook for real-time activity feed updates.
 *
 * Connects to the registry's WS endpoint, filters for `feed_entry` messages,
 * and prepends new entries to matching react-query cache entries.
 * Uses exponential backoff reconnect (1s -> 30s cap).
 * No-op when `USE_FIXTURES=true`.
 *
 * Returns connection status for UI display.
 */
export function useActivityWebSocket(filters?: WebSocketFilters): { connectionStatus: ConnectionStatus } {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  const prependEntry = useCallback(
    (entry: FeedEntry) => {
      queryClient.setQueriesData<ActivityFeedResponse>(
        { queryKey: [...registryKeys.all, 'activity-feed'] },
        (old) => {
          if (!old) return old;
          if (old.entries.some((e) => e.log_sequence === entry.log_sequence)) {
            return old;
          }
          return {
            ...old,
            entries: [entry, ...old.entries],
            log_size: old.log_size != null ? old.log_size + 1 : undefined,
          };
        },
      );
    },
    [queryClient],
  );

  useEffect(() => {
    if (USE_FIXTURES) return;

    function connect() {
      setConnectionStatus('reconnecting');
      const wsProtocol = REGISTRY_BASE_URL.startsWith('https') ? 'wss' : 'ws';
      const baseUrl = REGISTRY_BASE_URL.replace(/^https?/, wsProtocol);
      const ws = new WebSocket(`${baseUrl}/v1/ws/events`);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectDelayRef.current = 1000;
        setConnectionStatus('connected');
        // Send subscription filters if provided
        if (filters && Object.keys(filters).length > 0) {
          ws.send(JSON.stringify({ action: 'subscribe', filters }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (isFeedEntryMessage(data)) {
            const entry: FeedEntry = {
              log_sequence: data.log_sequence,
              entry_type: data.entry_type as FeedEntry['entry_type'],
              actor_did: data.actor_did,
              summary: data.summary,
              metadata: data.metadata,
              occurred_at: data.occurred_at,
              merkle_included: data.merkle_included,
              is_genesis_phase: data.is_genesis_phase,
            };
            prependEntry(entry);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        setConnectionStatus('reconnecting');
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
          connect();
        }, reconnectDelayRef.current);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnectionStatus('disconnected');
    };
  }, [prependEntry]);

  return { connectionStatus };
}
