/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import React, { useEffect, useState } from "react";

// Utils
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../context/AuthContext";

// Toast
import { showSuccessToast, showErrorToast } from "../utils/toast";

// Endpoints
import {
  adminfetchAllStudents,
  deleteStudent,
  passwordReset,
  updateStudentInformation,
  verifyProfessor,
  fetchUserAttendance,
  fetchUserDuties,
  fetchAllUserAttendance,
  fetchAllDutiesOfGroup,
  fetchAllDutiesPerArea,
} from "../api";

// Icons
import { Download } from "lucide-react";

// PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Members = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [verifyUser, setVerifyUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // PDF
  const [attendance, setAttendance] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [duties, setDuties] = useState([]);
  const [allDuties, setAllDuties] = useState([]);
  const [allDutiesByArea, setAllDutiesByArea] = useState([]);

  // Debounce search input
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchMembers();
  }, []);

  // Apply filter only when debouncedSearch changes
  useEffect(() => {
    if (!debouncedSearch) {
      setFiltered(members);
    } else {
      setFiltered(
        members.filter(
          (m) =>
            m.schoolId?.toLowerCase().includes(debouncedSearch) ||
            m.name?.toLowerCase().includes(debouncedSearch)
        )
      );
    }
  }, [debouncedSearch, members]);

  const fetchMembers = async () => {
    try {
      const res = await adminfetchAllStudents();
      if (res.data.success) {
        setMembers(res.data.users);
        setFiltered(res.data.users);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      showErrorToast("Failed to load members");
    }
  };

  // search handler only updates state
  const handleSearch = (e) => {
    setSearch(e.target.value.toLowerCase());
  };

  // Verify A Professor
  const handleVerification = async (id) => {
    try {
      const res = await verifyProfessor(id);
      if (res.data.success) {
        showSuccessToast("Professor verify successfully!");
        setVerifyUser(null);
        fetchMembers();
      } else {
        showErrorToast(res.data.message);
      }
    } catch (err) {
      showErrorToast(err.response?.data.message);
      console.error("Update error:", err.response?.data || err.message);
    }
  };

  // update user
  const handleUpdate = async (id) => {
    try {
      const res = await updateStudentInformation(id, editingUser);
      if (res.data.success) {
        showSuccessToast("User updated successfully!");
        setEditingUser(null);
        fetchMembers();
      } else {
        showErrorToast(res.data.message);
      }
    } catch (err) {
      showErrorToast(err.response?.data.message);
      console.error("Update error:", err.response?.data || err.message);
    }
  };

  const handleResetPassword = async (id) => {
    try {
      const res = await passwordReset(id);
      if (res.data.success) {
        showSuccessToast("Password Reset successfully!");
        setResettingUser(null);
      } else {
        showErrorToast(res.data.message);
      }
    } catch (err) {
      showErrorToast(err.response?.data.message);
      console.error("Delete error:", err.response?.data || err.message);
    }
  };

  // delete user
  const handleDelete = async (id) => {
    try {
      const res = await deleteStudent(id);
      if (res.data.success) {
        showSuccessToast("User deleted successfully!");
        setDeletingUser(null);
        fetchMembers();
      } else {
        showErrorToast(res.data.message);
      }
    } catch (err) {
      showErrorToast(err.response?.data.message);
      console.error("Delete error:", err.response?.data || err.message);
    }
  };

  const fetchAttendance = async (member) => {
    try {
      const { data } = await fetchUserAttendance(member.schoolId);
      const records = data.records || [];
      setAttendance(records);
      handleGenerateAttendancePDF(records, member); // pass member
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to fetch attendance. Please try again.";
      showErrorToast(message);
    }
  };

  const fetchDuties = async (member) => {
    try {
      const { data } = await fetchUserDuties(member._id);
      const dutiesData = data.duties || [];
      setDuties(dutiesData);
      handleGenerateDutiesPDF(dutiesData, member); // pass member
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to fetch duties. Please try again.";
      console.error(message);
    }
  };

  const fetchAllAttendance = async () => {
    try {
      const { data } = await fetchAllUserAttendance();
      const allAttendanceData = data.sections || [];
      setAllAttendance(allAttendanceData);
      handleGenerateAllAttendancePDF(allAttendanceData);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to fetch all attendance. Please try again.";
      console.error(message);
    }
  };

  const fetchAllDuties = async () => {
    try {
      // const { data } = await fetchAllDutiesOfGroup();
      const { data } = await fetchAllDutiesPerArea();
      const allDuties = data.areas || [];
      setAllDutiesByArea(allDuties);
      handleGenerateAllDutiesPDF(allDuties);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to fetch all attendance. Please try again.";
      console.error(message);
    }
  };

  // Generate Attendance PDF
  const handleGenerateAttendancePDF = async (recordsParam, member) => {
    const records = recordsParam || attendance;
    if (!records || records.length === 0) {
      return showErrorToast("Student does not have attendance.");
    }

    // --- helper to load logo into a dataURL (avoids onload timing issues) ---
    const loadImageAsDataURL = (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = url;
      });

    // Attempt to load the logo; if it fails we just continue without logo
    let logoDataUrl = null;
    try {
      logoDataUrl = await loadImageAsDataURL("/mcare.png");
    } catch (err) {
      // fallback: continue without logo
      console.warn("Could not load logo for PDF watermark:", err);
      logoDataUrl = null;
    }

    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = { top: 110, left: 40, right: 40, bottom: 60 };

    // generated timestamp for footer (bottom-left)
    const generatedAt = new Date().toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // prepare table rows (index, formatted date, formatted time)
    const tableColumn = ["#", "Date", "Time In"];
    const tableRows = records.map((record, i) => {
      const dateObj = new Date(record.date);
      const formattedDate = dateObj.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      // parse timeIn "HH:MM:SS"
      const [h, m, s] = (record.timeIn || "00:00:00").split(":").map(Number);
      const timeObj = new Date();
      timeObj.setHours(h, m, s || 0);
      const formattedTime = timeObj.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return [i + 1, formattedDate, formattedTime];
    });

    // Generate table with header + repeated page hooks
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      margin,
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 6,
        lineColor: [22, 163, 74], // green borders
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [22, 163, 74], // green header
        textColor: [255, 255, 255],
        halign: "center",
        valign: "middle",
        fontSize: 12,
        fontStyle: "bold",
      },
      bodyStyles: {
        halign: "center",
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244], // light green row
      },
      // This is called for each page after table content - we draw header/footer/watermark here
      didDrawPage: (data) => {
        const pageNumber = data.pageNumber;

        // --- faint logo watermark (center) ---
        if (logoDataUrl) {
          try {
            doc.setGState(new doc.GState({ opacity: 0.06 }));
            const imgW = 220;
            const imgH = 220;
            doc.addImage(
              logoDataUrl,
              "PNG",
              (pageWidth - imgW) / 2,
              (pageHeight - imgH) / 2,
              imgW,
              imgH,
              undefined,
              "FAST"
            );
            doc.setGState(new doc.GState({ opacity: 1 }));
          } catch (e) {
            // if setGState or addImage fails for some reason, ignore and continue
            console.warn("logo watermark draw failed:", e);
          }
        }

        // --- repeated watermark text (diagonal, faint) ---
        try {
          doc.setFontSize(48);
          doc.setTextColor(150, 150, 150);
          doc.setFont("helvetica", "bold");
          doc.setGState(new doc.GState({ opacity: 0.06 }));
          for (let y = 80; y < pageHeight; y += 180) {
            for (let x = -50; x < pageWidth; x += 220) {
              doc.text("MCare", x, y, { angle: 35 });
            }
          }
          doc.setGState(new doc.GState({ opacity: 1 }));
        } catch (e) {
          // if GState isn't available in this environment, the watermark will still show lighter because of color
          console.warn("watermark draw issue:", e);
        }

        // --- Header (on top so it's always readable) ---
        doc.setFontSize(18);
        doc.setTextColor(22, 163, 74);
        doc.setFont("helvetica", "bold");
        doc.text("Attendance Report", margin.left, 40);

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${member?.name || "Test User"}`, margin.left, 60);
        doc.text(`School ID: ${member?.schoolId || "—"}`, margin.left, 76);

        // --- Generated at (bottom-left) ---
        doc.setFontSize(9);
        doc.setTextColor(110);
        doc.text(`Generated: ${generatedAt}`, margin.left, pageHeight - 30);

        // --- Page number (bottom-right) ---
        doc.text(
          `Page ${pageNumber}`,
          pageWidth - margin.right - 40,
          pageHeight - 30
        );
      },
    });

    // finally save
    doc.save(`${member?.username || "attendance"}_attendance.pdf`);
  };

  // Generate Duties PDF
  const handleGenerateDutiesPDF = async (recordsParam, member) => {
    const records = recordsParam || duties;
    if (!records || records.length === 0) {
      return showErrorToast("Student does not have duties.");
    }

    // helper to load logo
    const loadImageAsDataURL = (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = url;
      });

    let logoDataUrl = null;
    try {
      logoDataUrl = await loadImageAsDataURL("/mcare.png");
    } catch (err) {
      console.warn("Could not load logo for PDF watermark:", err);
      logoDataUrl = null;
    }

    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = { top: 110, left: 40, right: 40, bottom: 60 };

    // generated timestamp for footer
    const generatedAt = new Date().toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Prepare table data
    const tableColumn = [
      "Date",
      "Group",
      "Time",
      "Clinical Instructor",
      "Place",
      "Area",
    ];
    const tableRows = records.map((duty) => {
      // Date
      const dateObj = new Date(duty.date);
      const formattedDate = dateObj.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Time (format range if possible)
      let formattedTime = duty.time || "—";
      try {
        if (formattedTime.includes("-")) {
          const [start, end] = formattedTime.split("-").map((t) => t.trim());
          const convertTo12Hour = (t) => {
            const [h, m] = t.split(":").map(Number);
            const d = new Date();
            d.setHours(h, m, 0);
            return d.toLocaleTimeString("en-PH", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
          };
          formattedTime = `${convertTo12Hour(start)} - ${convertTo12Hour(end)}`;
        }
      } catch (err) {
        console.warn("Time parse failed:", err);
      }

      return [
        formattedDate,
        duty.group?.name || "—",
        formattedTime,
        duty.clinicalInstructor || "—",
        duty.place || "—",
        duty.area || "—",
      ];
    });

    // Table with header/footer/watermark
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      margin,
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 6,
        lineColor: [22, 163, 74],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: [255, 255, 255],
        halign: "center",
        valign: "middle",
        fontSize: 12,
        fontStyle: "bold",
      },
      bodyStyles: {
        halign: "center",
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244],
      },
      didDrawPage: (data) => {
        const pageNumber = data.pageNumber;

        // watermark logo
        if (logoDataUrl) {
          try {
            doc.setGState(new doc.GState({ opacity: 0.06 }));
            const imgW = 220;
            const imgH = 220;
            doc.addImage(
              logoDataUrl,
              "PNG",
              (pageWidth - imgW) / 2,
              (pageHeight - imgH) / 2,
              imgW,
              imgH,
              undefined,
              "FAST"
            );
            doc.setGState(new doc.GState({ opacity: 1 }));
          } catch (e) {
            console.warn("logo watermark draw failed:", e);
          }
        }

        // repeated text watermark
        try {
          doc.setFontSize(48);
          doc.setTextColor(150, 150, 150);
          doc.setFont("helvetica", "bold");
          doc.setGState(new doc.GState({ opacity: 0.06 }));
          for (let y = 80; y < pageHeight; y += 180) {
            for (let x = -50; x < pageWidth; x += 220) {
              doc.text("MCare", x, y, { angle: 35 });
            }
          }
          doc.setGState(new doc.GState({ opacity: 1 }));
        } catch (e) {
          console.warn("watermark draw issue:", e);
        }

        // Header
        doc.setFontSize(18);
        doc.setTextColor(22, 163, 74);
        doc.setFont("helvetica", "bold");
        doc.text("Duties Report", margin.left, 40);

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${member?.name || "Test User"}`, margin.left, 60);
        doc.text(`School ID: ${member?.schoolId || "—"}`, margin.left, 76);

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(110);
        doc.text(`Generated: ${generatedAt}`, margin.left, pageHeight - 30);

        doc.text(
          `Page ${pageNumber}`,
          pageWidth - margin.right - 40,
          pageHeight - 30
        );
      },
    });

    // Save PDF
    doc.save(`${member?.username || "duties"}_duties.pdf`);
  };

  const handleGenerateAllAttendancePDF = async (sectionsParam) => {
    const sections = sectionsParam || allAttendance;
    // expects array: [{ section: "BSN-3A", records: [...] }, { section: "BSN-3B", records: [...] }]
    if (!sections || sections.length === 0) {
      return showErrorToast("No attendance records available.");
    }

    // --- helper to load logo ---
    const loadImageAsDataURL = (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = url;
      });

    let logoDataUrl = null;
    try {
      logoDataUrl = await loadImageAsDataURL("/mcare.png");
    } catch (err) {
      console.warn("Could not load logo for PDF watermark:", err);
    }

    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = { top: 110, left: 40, right: 40, bottom: 60 };

    const generatedAt = new Date().toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Loop through sections
    sections.forEach((section, sectionIndex) => {
      if (sectionIndex > 0) {
        doc.addPage();
      }

      // --- Prepare table rows ---
      const tableColumn = ["#", "School ID", "Username", "Date", "Time In"];
      const tableRows = section.records.map((record, i) => {
        const dateObj = new Date(record.date);
        const formattedDate = dateObj.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const [h, m, s] = (record.timeIn || "00:00:00").split(":").map(Number);
        const timeObj = new Date();
        timeObj.setHours(h, m, s || 0);
        const formattedTime = timeObj.toLocaleTimeString("en-PH", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        return [
          i + 1,
          record.user?.schoolId || "—",
          record.user?.username || "—",
          formattedDate,
          formattedTime,
        ];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        margin,
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: 6,
          lineColor: [22, 163, 74],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [22, 163, 74],
          textColor: [255, 255, 255],
          halign: "center",
          valign: "middle",
          fontSize: 12,
          fontStyle: "bold",
        },
        bodyStyles: {
          halign: "center",
          valign: "middle",
        },
        alternateRowStyles: {
          fillColor: [240, 253, 244],
        },
        didDrawPage: (data) => {
          const pageNumber = data.pageNumber;

          // --- watermark logo ---
          if (logoDataUrl) {
            try {
              doc.setGState(new doc.GState({ opacity: 0.06 }));
              const imgW = 220;
              const imgH = 220;
              doc.addImage(
                logoDataUrl,
                "PNG",
                (pageWidth - imgW) / 2,
                (pageHeight - imgH) / 2,
                imgW,
                imgH,
                undefined,
                "FAST"
              );
              doc.setGState(new doc.GState({ opacity: 1 }));
            } catch (e) {
              console.warn("logo watermark draw failed:", e);
            }
          }

          // --- watermark text ---
          try {
            doc.setFontSize(48);
            doc.setTextColor(150, 150, 150);
            doc.setFont("helvetica", "bold");
            doc.setGState(new doc.GState({ opacity: 0.06 }));
            for (let y = 80; y < pageHeight; y += 180) {
              for (let x = -50; x < pageWidth; x += 220) {
                doc.text("MCare", x, y, { angle: 35 });
              }
            }
            doc.setGState(new doc.GState({ opacity: 1 }));
          } catch (e) {
            console.warn("watermark draw issue:", e);
          }

          // --- Header ---
          doc.setFontSize(18);
          doc.setTextColor(22, 163, 74);
          doc.setFont("helvetica", "bold");
          doc.text("Attendance Report", margin.left, 40);

          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "normal");
          doc.text(`Section: ${section.section}`, margin.left, 60);
          doc.text(`Total Records: ${section.records.length}`, margin.left, 76);

          // --- Footer ---
          doc.setFontSize(9);
          doc.setTextColor(110);
          doc.text(`Generated: ${generatedAt}`, margin.left, pageHeight - 30);
          doc.text(
            `Page ${pageNumber}`,
            pageWidth - margin.right - 40,
            pageHeight - 30
          );
        },
      });
    });

    // Save the file
    doc.save("attendance_by_section.pdf");
  };

  // Generate Duties PDF (Per Area)
  const handleGenerateAllDutiesPDF = async (areasParam) => {
    const areas = areasParam || allDutiesByArea; // expects [{ area, duties: [...] }]
    if (!areas || areas.length === 0) {
      return showErrorToast("No duties found for any area.");
    }

    // helper: load logo
    const loadImageAsDataURL = (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = url;
      });

    let logoDataUrl = null;
    try {
      logoDataUrl = await loadImageAsDataURL("/mcare.png");
    } catch (err) {
      console.warn("Could not load logo for PDF watermark:", err);
      logoDataUrl = null;
    }

    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = { top: 110, left: 40, right: 40, bottom: 60 };

    const generatedAt = new Date().toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // loop through each area and render duties
    areas.forEach((areaItem, index) => {
      if (index > 0) doc.addPage(); // new page per area

      const { area, duties } = areaItem;

      // prepare rows for this area
      const tableColumn = [
        "Date",
        "Time",
        "Clinical Instructor",
        "Place",
        "Group",
      ];
      const tableRows = (duties || []).map((duty) => {
        const dateObj = new Date(duty.date);
        const formattedDate = dateObj.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return [
          formattedDate,
          duty.time || "—",
          duty.clinicalInstructor || "—",
          duty.place || "—",
          duty.group?.name || "—",
        ];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        margin,
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: 6,
          lineColor: [22, 163, 74],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [22, 163, 74],
          textColor: [255, 255, 255],
          halign: "center",
          valign: "middle",
          fontSize: 12,
          fontStyle: "bold",
        },
        bodyStyles: {
          halign: "center",
          valign: "middle",
        },
        alternateRowStyles: {
          fillColor: [240, 253, 244],
        },
        didDrawPage: () => {
          const pageNumber = doc.internal.getNumberOfPages();

          // --- watermark logo
          if (logoDataUrl) {
            try {
              doc.setGState(new doc.GState({ opacity: 0.06 }));
              const imgW = 220;
              const imgH = 220;
              doc.addImage(
                logoDataUrl,
                "PNG",
                (pageWidth - imgW) / 2,
                (pageHeight - imgH) / 2,
                imgW,
                imgH,
                undefined,
                "FAST"
              );
              doc.setGState(new doc.GState({ opacity: 1 }));
            } catch (e) {
              console.warn("logo watermark draw failed:", e);
            }
          }

          // --- repeated text watermark
          try {
            doc.setFontSize(48);
            doc.setTextColor(150, 150, 150);
            doc.setFont("helvetica", "bold");
            doc.setGState(new doc.GState({ opacity: 0.06 }));
            for (let y = 80; y < pageHeight; y += 180) {
              for (let x = -50; x < pageWidth; x += 220) {
                doc.text("MCare", x, y, { angle: 35 });
              }
            }
            doc.setGState(new doc.GState({ opacity: 1 }));
          } catch (e) {
            console.warn("watermark draw issue:", e);
          }

          // --- Header for each area
          doc.setFontSize(18);
          doc.setTextColor(22, 163, 74);
          doc.setFont("helvetica", "bold");
          doc.text("Duties Report", margin.left, 40);

          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "normal");
          doc.text(`Area: ${area}`, margin.left, 60);

          // --- Footer
          doc.setFontSize(9);
          doc.setTextColor(110);
          doc.text(`Generated: ${generatedAt}`, margin.left, pageHeight - 30);
          doc.text(
            `Page ${pageNumber}`,
            pageWidth - margin.right - 40,
            pageHeight - 30
          );
        },
      });
    });

    // save
    doc.save("all_areas_duties.pdf");
  };

  return (
    <div className="p-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search by School ID or Name"
        value={search}
        onChange={handleSearch}
        className="w-full p-2 mb-4 border rounded-lg"
      />

      <div className="mb-4">
        <h1>Download Reports</h1>
        <div className="flex gap-2">
          <button
            onClick={() => fetchAllAttendance()}
            className="flex items-center justify-center w-full gap-2 px-4 py-1 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            <Download size={16} />
            All Attendance
          </button>
          <button
            onClick={() => fetchAllDuties()}
            className="flex items-center justify-center w-full gap-2 px-4 py-1 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            <Download size={16} />
            All Duties
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="flex flex-col space-y-4">
        {filtered.map((user) => (
          <div
            key={user._id}
            className="flex flex-col justify-between gap-2 p-4 bg-white rounded-lg shadow-md"
          >
            <div className="flex items-center gap-3">
              <img
                src={user.profileImage}
                alt={user.name}
                onClick={() => setPreviewImage(user.profileImage)}
                className="object-cover w-12 h-12 border border-gray-200 rounded-full shadow-sm"
              />
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500">
                  {user.schoolId} • {user.username}
                </p>
                <p className="text-xs text-gray-400">Email: {user.email}</p>
                <p className="text-xs text-gray-400">
                  Role: {user.role === "user" ? "Student" : "Admin/Professor"}{" "}
                  {user.group ? `• Group: ${user.group.name}` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEditingUser(user)}
                className="px-3 py-1 text-sm text-white bg-blue-500 rounded-lg"
              >
                Edit
              </button>
              <button
                onClick={() => setResettingUser(user)}
                className="px-3 py-1 text-sm text-white bg-green-400 rounded-lg"
              >
                Reset Password
              </button>
              {user.role === "professor" && (
                <button
                  onClick={() => setVerifyUser(user)}
                  className="px-3 py-1 text-sm text-white bg-green-400 rounded-lg"
                >
                  Verify
                </button>
              )}

              <button
                onClick={() => setDeletingUser(user)}
                className="px-3 py-1 text-sm text-white bg-red-500 rounded-lg"
              >
                Delete
              </button>
            </div>
            {user.role === "user" && (
              <div className="flex gap-2">
                <button
                  onClick={() => fetchAttendance(user)}
                  className="flex items-center justify-center w-full gap-2 px-4 py-1 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  <Download size={16} />
                  Attendance
                </button>
                <button
                  onClick={() => fetchDuties(user)}
                  className="flex items-center justify-center w-full gap-2 px-4 py-1 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  <Download size={16} />
                  Duties
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setPreviewImage(null)} // close when clicking backdrop
        >
          {console.log(previewImage)}
          <div className="relative">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute px-3 py-1 text-sm font-extrabold text-white rounded-lg shadow-2xl top-2 right-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-md p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-lg font-bold">
              Edit User ({editingUser.schoolId})
            </h2>

            <p className="px-1 mb-2 text-sm text-gray-400">School ID:</p>
            <input
              className="w-full p-2 mb-2 border rounded"
              placeholder="School ID"
              value={editingUser.schoolId || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, schoolId: e.target.value })
              }
            />
            <p className="px-1 mb-2 text-sm text-gray-400">Username:</p>
            <input
              className="w-full p-2 mb-2 border rounded"
              placeholder="Username"
              value={editingUser.username || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, username: e.target.value })
              }
            />
            <p className="px-1 mb-2 text-sm text-gray-400">Name:</p>
            <input
              className="w-full p-2 mb-2 border rounded"
              placeholder="Name"
              value={editingUser.name || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, name: e.target.value })
              }
            />
            {editingUser.role === "user" && (
              <>
                <p className="px-1 mb-2 text-sm text-gray-400">Section:</p>
                <input
                  className="w-full p-2 mb-2 border rounded"
                  placeholder="Section"
                  value={editingUser.section || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, section: e.target.value })
                  }
                />
                <p className="px-1 mb-2 text-sm text-gray-400">Course:</p>
                <input
                  className="w-full p-2 mb-2 border rounded"
                  placeholder="Course"
                  value={editingUser.course || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, course: e.target.value })
                  }
                />
              </>
            )}
            <p className="px-1 mb-2 text-sm text-gray-400">Department:</p>
            <input
              className="w-full p-2 mb-2 border rounded"
              placeholder="Department"
              value={editingUser.department || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, department: e.target.value })
              }
            />

            <p className="px-1 mb-2 text-sm text-gray-400">Role:</p>
            <select
              className="w-full p-2 mb-4 border rounded"
              value={editingUser.role}
              onChange={(e) =>
                setEditingUser({ ...editingUser, role: e.target.value })
              }
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white bg-blue-600 rounded"
                onClick={() => handleUpdate(editingUser._id)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-sm p-6 text-center bg-white rounded-lg">
            <h2 className="mb-4 text-lg font-bold">Delete User</h2>
            <p className="mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingUser.name}</span>?
            </p>
            <div className="flex justify-center space-x-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setDeletingUser(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white bg-red-600 rounded"
                onClick={() => handleDelete(deletingUser._id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {verifyUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-sm p-6 text-center bg-white rounded-lg">
            <h2 className="mb-4 text-lg font-bold">Verify Professor</h2>
            <p className="mb-6">
              Are you sure you want to verify{" "}
              <span className="font-semibold">{verifyUser.name}'s </span>
              account?
            </p>
            <div className="flex justify-center space-x-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setVerifyUser(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white bg-green-600 rounded"
                onClick={() => handleVerification(verifyUser._id)}
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {resettingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-sm p-6 text-center bg-white rounded-lg">
            <h2 className="mb-4 text-lg font-bold">Reset Password</h2>
            <p className="mb-6">
              Are you sure you want to reset{" "}
              <span className="font-semibold">{resettingUser.name}'s </span>
              password?
            </p>
            <div className="flex justify-center space-x-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setResettingUser(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white bg-red-600 rounded"
                onClick={() => handleResetPassword(resettingUser._id)}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
