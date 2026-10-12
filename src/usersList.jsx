import { memo, useMemo, useState } from 'react';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { FixedSizeList } from 'react-window';
import { fetchUsers } from './mockApi.js';
import useDebounce from './useDebounce.js';

const PAGE_SIZE = 50;
const ROW_HEIGHT = 100;

// React.memo: a row re-renders only if its own props change
const Row = memo(function Row({ index, style, data }) {
  const user = data[index];
  if (!user) {
    return <div style={style} className="row loading">Loading more…</div>;
  }
  return (
    <div style={style} className="row">
      <span className="id">{user.id}</span>
      <span className="name">{user.name}</span>
      <span className="email">{user.email}</span>
    </div>
  );
});

export default function UserList() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['users', debouncedSearch],
    queryFn: ({ pageParam }) =>
      fetchUsers({ cursor: pageParam, limit: PAGE_SIZE, search: debouncedSearch }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    placeholderData: keepPreviousData,
  });

  // Flatten pages [[50 items],[50 items]] into one array
  const users = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  // One extra row at the end is the "loading more" placeholder
  const itemCount = hasNextPage ? users.length + 1 : users.length;

  const handleItemsRendered = ({ visibleStopIndex }) => {
    if (visibleStopIndex >= users.length - 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <section>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="status">
          {isFetching ? 'Fetching…' : 'Up to date'} · loaded {users.length.toLocaleString()} of{' '}
          {total.toLocaleString()}
        </span>
      </div>

      {isLoading && <p className="msg">Loading first page…</p>}
      {isError && <p className="msg error">Failed: {error.message}</p>}

      {!isLoading && !isError && (
        <div className="list">
          <FixedSizeList
            height={480}
            width="100%"
            itemCount={itemCount}
            itemSize={ROW_HEIGHT}
            itemData={users}
            onItemsRendered={handleItemsRendered}
          >
            {Row}
          </FixedSizeList>
        </div>
      )}

      {!isLoading && users.length === 0 && (
        <p className="msg">No users match "{debouncedSearch}".</p>
      )}
    </section>
  );
}