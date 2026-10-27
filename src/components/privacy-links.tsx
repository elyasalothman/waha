import { Link } from "@tanstack/react-router";
export function PrivacyLinks() {
  return (
    <nav aria-label="الخصوصية والبيانات" className="my-4 flex flex-wrap gap-4 text-sm">
      <Link to="/privacy" className="min-h-11 content-center text-primary underline">
        سياسة الخصوصية
      </Link>
      <Link to="/delete-account" className="min-h-11 content-center text-primary underline">
        حذف الحساب والبيانات
      </Link>
    </nav>
  );
}
