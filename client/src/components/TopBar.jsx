import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getRandomAvatar } from '../data/avatarOptions';
import { API_BASE_URL } from '../../domain';

import {
  BellIcon,
  BriefcaseIcon,
  FireIcon,
  GridIcon,
  HomeIcon,
  SearchIcon,
  ShieldIcon,
} from './Icons';

const topIcons = [HomeIcon, FireIcon, GridIcon, BriefcaseIcon, ShieldIcon];
const AUTH_STORAGE_KEY = 'mycommunityUser';

const POSTS_API_URL = `${API_BASE_URL}/posts`;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [postPdf, setPostPdf] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const syncUser = () => {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);

      if (!savedUser) {
        setLoggedInUser(null);
        return;
      }

      const parsedUser = JSON.parse(savedUser);

      if (!parsedUser.avatar) {
        const updatedUser = {
          ...parsedUser,
          avatar: getRandomAvatar(),
        };

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
        setLoggedInUser(updatedUser);
        return;
      }

      setLoggedInUser(parsedUser);
    };

    syncUser();
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setLoggedInUser(null);
    setShowProfileMenu(false);
  };

  const redirectToLogin = () => {
    const redirect = `${location.pathname}${location.search}`;
    navigate(`/auth?mode=login&redirect=${encodeURIComponent(redirect)}`);
  };

  const handleOpenPostModal = () => {
    if (!loggedInUser) {
      redirectToLogin();
      return;
    }

    setShowPostModal(true);
    setShowProfileMenu(false);
    setPostError('');
    setPostSuccess('');
  };

  const handleClosePostModal = () => {
    setShowPostModal(false);
    setPostTitle('');
    setPostDescription('');
    setPostImage(null);
    setPostPdf(null);
    setPostError('');
    setPostSuccess('');
  };

  const handlePostImageChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setPostImage(null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setPostImage(null);
      setPostError('only upload 5mb img');
      event.target.value = '';
      return;
    }

    setPostError('');
    setPostImage(file);
  };

  const handlePostPdfChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setPostPdf(null);
      return;
    }

    if (file.type !== 'application/pdf') {
      setPostPdf(null);
      setPostError('Please upload a PDF file only');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      setPostPdf(null);
      setPostError('only upload 10mb pdf');
      event.target.value = '';
      return;
    }

    setPostError('');
    setPostPdf(file);
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read image file'));
    });

  const parseResponseMessage = (data) => {
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors.join(', ');
    }

    return data?.message || 'Something went wrong. Please try again.';
  };

  const handleCreatePost = async () => {
    if (!loggedInUser) {
      setPostError('Please login first to create a post');
      return;
    }

    setIsPosting(true);
    setPostError('');
    setPostSuccess('');

    try {
      const imageString = postImage ? await fileToBase64(postImage) : '';
      const pdfString = postPdf ? await fileToBase64(postPdf) : '';

      const response = await fetch(POSTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: loggedInUser.id,
          username: loggedInUser.username,
          avatar: loggedInUser.avatar,
          title: postTitle,
          description: postDescription,
          image: imageString,
          pdf: pdfString,
          pdfName: postPdf?.name || '',
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(parseResponseMessage(data));
      }

      setPostSuccess(data.message || 'Post created successfully');
      setPostTitle('');
      setPostDescription('');
      setPostImage(null);
      setPostPdf(null);
      setTimeout(() => {
        handleClosePostModal();
      }, 900);
    } catch (error) {
      setPostError(error.message);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-stroke/80 bg-[#1c1c1c]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-3 py-3 sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex items-end gap-[2px]">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span className="h-2.5 w-1 rounded-full bg-sky-400" />
              <span className="h-4 w-1 rounded-full bg-orange-500" />
              <span className="h-3 w-1 rounded-full bg-sky-400" />
              <span className="h-5 w-1 rounded-full bg-orange-500" />
            </div>
            <div className="hidden items-center gap-2 text-textSoft md:flex">
              {topIcons.map((Icon, index) => (
                <button
                  key={index}
                  className="rounded-full border border-transparent p-2 transition hover:border-stroke hover:bg-panel"
                >
                  <Icon />
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto hidden max-w-xl flex-1 items-center md:flex">
            <div className="flex w-full items-center gap-3 rounded-full border border-accent/60 bg-[#111111] px-4 py-2 text-sm text-textSoft">
              <SearchIcon className="h-4 w-4 shrink-0" />
              <input
                type="text"
                placeholder="Find anything..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-textSoft"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPostModal}
              className="hidden rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 sm:inline-flex"
            >
              Post
            </button>
            <button className="rounded-full border border-stroke bg-panel p-2 text-textSoft transition hover:text-white">
              <BellIcon />
            </button>
            {loggedInUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu((currentValue) => !currentValue)}
                  className="rounded-full border border-stroke transition hover:border-accent"
                >
                  <img
                    src={loggedInUser.avatar}
                    alt={loggedInUser.username || 'User avatar'}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-14 z-40 w-56 overflow-hidden rounded-2xl border border-stroke bg-panel shadow-panel">
                    <div className="border-b border-stroke px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-textSoft">
                        Signed in as
                      </p>
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="mt-1 block text-sm font-semibold text-white transition hover:text-sky-300"
                      >
                        {loggedInUser.username}
                      </Link>
                    </div>

                    <div className="p-2">
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="block w-full rounded-xl px-3 py-2 text-left text-sm text-white transition hover:bg-[#2b2b2b]"
                      >
                        Edit Profile
                      </Link>
                      <button
                        type="button"
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-white transition hover:bg-[#2b2b2b]"
                      >
                        Wishlist
                      </button>
                      <button
                        type="button"
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-white transition hover:bg-[#2b2b2b]"
                      >
                        Help &amp; Support
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-300 transition hover:bg-[#2b2b2b] hover:text-red-200"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth?mode=login"
                className="rounded-full border border-stroke bg-[#111111] px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-500 hover:text-sky-300"
              >
                Login
              </Link>
            )}
          </div>
        </div>
        <div className="border-t border-stroke/60 px-3 py-3 md:hidden">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 rounded-full border border-accent/60 bg-[#111111] px-4 py-2 text-sm text-textSoft">
            <SearchIcon className="h-4 w-4 shrink-0" />
            <input
              type="text"
              placeholder="Find anything..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-textSoft"
            />
          </div>
        </div>
      </header>

      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-xl bg-[#1f1f1f] p-5 shadow-lg md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={
                    loggedInUser?.avatar ||
                    'https://i.pravatar.cc/100?img=12'
                  }
                  alt="user"
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <h3 className="font-medium text-white">
                    {loggedInUser?.username || 'Mohit Rana'}
                  </h3>
                  {/* <p className="text-sm text-gray-400">Civil Engineer</p> */}
                </div>
              </div>

              <button
                type="button"
                onClick={handleClosePostModal}
                className="rounded-full border border-stroke px-3 py-1 text-sm text-textSoft transition hover:text-white"
              >
                Close
              </button>
            </div>

            <input
              type="text"
              value={postTitle}
              onChange={(event) => setPostTitle(event.target.value)}
              placeholder="Enter title..."
              className="mb-4 w-full rounded-md bg-[#2a2a2a] px-3 py-2 text-white placeholder-gray-400 focus:outline-none"
            />

            <textarea
              value={postDescription}
              onChange={(event) => setPostDescription(event.target.value)}
              placeholder="Write description..."
              className="mb-4 min-h-[120px] w-full resize-none rounded-md bg-[#2a2a2a] px-3 py-2 text-white placeholder-gray-400 focus:outline-none"
            />

            <div className="mb-5">
              <label className="mb-2 block text-sm text-gray-400">Upload Image</label>
              <p className="mb-2 text-xs text-textSoft">Only upload 5mb img</p>

              <input
                type="file"
                accept="image/*"
                onChange={handlePostImageChange}
                className="text-gray-300"
              />

              {postImage && (
                <img
                  src={URL.createObjectURL(postImage)}
                  alt="preview"
                  className="mt-3 h-40 w-full rounded-md object-cover"
                />
              )}
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm text-gray-400">Upload PDF</label>
              <p className="mb-2 text-xs text-textSoft">Only upload 10mb pdf</p>

              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handlePostPdfChange}
                className="text-gray-300"
              />

              {postPdf && (
                <div className="mt-3 rounded-md border border-stroke bg-[#2a2a2a] px-4 py-3 text-sm text-white">
                  {postPdf.name}
                </div>
              )}
            </div>

            {postError && <p className="mb-3 text-sm text-red-400">{postError}</p>}
            {postSuccess && <p className="mb-3 text-sm text-emerald-400">{postSuccess}</p>}

            <button
              type="button"
              onClick={handleCreatePost}
              disabled={isPosting}
              className="w-full rounded-full bg-white py-3 font-medium text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPosting ? 'Uploading...' : 'Upload Post'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default TopBar;
