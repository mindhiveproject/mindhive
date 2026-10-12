"use client";

import ClassHeader from "../../TeacherClasses/ClassPage/Header";

/**
 * Student class header — same UI pattern as the teacher class header
 * (title, description, teacher + mentors chips), but read-only.
 */
export default function Header({ myclass, loading = false }) {
  return <ClassHeader myclass={myclass} loading={loading} readOnly />;
}
