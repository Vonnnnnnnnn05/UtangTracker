"use client";

import { onSnapshot, type Query } from "firebase/firestore";
import { useEffect, useState } from "react";

type CollectionState<T> = {
  data: T[];
  loading: boolean;
  error: Error | null;
};

export function useCollection<T>(collectionQuery: Query<T> | null): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    loading: Boolean(collectionQuery),
    error: null,
  });

  useEffect(() => {
    if (!collectionQuery) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    setState((current) => ({ ...current, loading: true }));
    return onSnapshot(
      collectionQuery,
      (snapshot) => {
        setState({
          data: snapshot.docs.map((document) => document.data()),
          loading: false,
          error: null,
        });
      },
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [collectionQuery]);

  return state;
}
