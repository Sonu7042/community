import { Link } from 'react-router-dom';

const AUTH_STORAGE_KEY = 'mycommunityUser';

const profileTabs = ['Profile', 'Questions', 'Answers', 'Post', 'Like', 'Saved', 'Shared'];

function Profile() {
  const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  const loggedInUser = savedUser ? JSON.parse(savedUser) : null;

  const profileName = loggedInUser?.username || 'Sonia Singh';
  const profileAvatar =
    loggedInUser?.avatar ||
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80';

  return (
    <div className="min-h-screen bg-[#1a1a1a] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#262626] px-5 py-2 text-sm text-textSoft transition hover:text-white"
        >
          Back
          <span className="text-xs">&larr;</span>
        </Link>

        <section className="overflow-hidden rounded-[18px] border border-stroke bg-[#262626] shadow-panel">
          <div className="flex flex-col gap-6 p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <img
                  src={profileAvatar}
                  alt={profileName}
                  className="h-[74px] w-[74px] rounded-full object-cover sm:h-[82px] sm:w-[82px]"
                />

                <div className="pt-1">
                  <h1 className="text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
                    {profileName}
                  </h1>
                  <button
                    type="button"
                    className="mt-2 text-sm text-[#d4d4d4] transition hover:text-white"
                  >
                    Add profile credential
                  </button>
                  <button
                    type="button"
                    className="mt-4 block text-sm text-[#c8c8c8] underline underline-offset-4 transition hover:text-white"
                  >
                    Write a description about yourself
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center self-end rounded-full border border-[#626262] text-lg text-[#d7d7d7] transition hover:border-white hover:text-white md:self-start"
              >
                ↗
              </button>
            </div>

            <div className="-mx-5 overflow-x-auto border-b border-[#686868] px-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              <div className="flex min-w-max items-center gap-8 text-[15px] text-[#bbbbbb]">
                {profileTabs.map((tab, index) => (
                  <button
                    key={tab}
                    type="button"
                    className={`border-b-2 px-2 py-4 transition ${
                      index === 0
                        ? 'border-sky-400 text-white'
                        : 'border-transparent hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[280px] sm:min-h-[340px]" />
          </div>
        </section>
      </div>
    </div>
  );
}

export default Profile;
