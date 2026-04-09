import LeftSidebar from '../components/LeftSidebar';
import PostCard from '../components/PostCard';
import RightSidebar from '../components/RightSidebar';
import TopBar from '../components/TopBar';
import { ads, navItems, posts, resourceItems } from '../data/mockData';

function HomePage() {
  return (
    <div className="min-h-screen bg-noise">
      <TopBar />

      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-5 px-3 py-5 sm:px-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6 xl:grid-cols-[260px_minmax(0,1fr)_260px]">
        <div className="order-2 xl:order-1">
          <LeftSidebar navItems={navItems} resourceItems={resourceItems} />
        </div>

        <section className="order-1 min-w-0 space-y-5 xl:order-2">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} featured={index === 1} />
          ))}
        </section>

        <div className="order-3">
          <RightSidebar ads={ads} />
        </div>
      </main>
    </div>
  );
}

export default HomePage;

