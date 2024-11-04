const LoadingSpinner = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50">
      <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white mt-4">กำลังโหลดโมเดล...</p>
    </div>
  );
export default LoadingSpinner;