import { notification, Spin } from "antd";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { BsCheck2Circle, BsPeople, BsDash, BsPlus } from "react-icons/bs";
import ReservationClose from "./ReservationClose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import ReservationDisableEnable from "../worker/ReservationDisableEnable";
import ReservationTermsConditionModal from "../WorkerModals/ReservationTermsConditionModal";

dayjs.extend(utc);
dayjs.extend(timezone);

const tables = [
  { reservation_id: 1, tableName: "1", capacity: 4, img: "/Table-1.png" },
  { reservation_id: 2, tableName: "2", capacity: 4, img: "/Table-2.png" },
  { reservation_id: 3, tableName: "3", capacity: 4, img: "/Table-3.png" },
  { reservation_id: 4, tableName: "4", capacity: 6, img: "/Table-4.png" },
  { reservation_id: 5, tableName: "5", capacity: 6, img: "/Table-5.png" },
  { reservation_id: 6, tableName: "6", capacity: 8, img: "/Table-6.png" },
  { reservation_id: 7, tableName: "7", capacity: 2, img: "/Table-7.png" },
  { reservation_id: 8, tableName: "8", capacity: 2, img: "/Table-8.png" },
  { reservation_id: 9, tableName: "9", capacity: 2, img: "/Table-9.png" },
];

const fieldClass =
  "font-core w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 " +
  "placeholder:text-slate-400 outline-none transition " +
  "focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20";

const labelClass = "font-core mb-1.5 block text-xs font-medium text-slate-600";

const Reservation = () => {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [reservationDate, setReservationDate] = useState<string>("");
  const [reservationTime, setReservationTime] = useState<string>("");
  const [numOfPeople, setNumOfPeople] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [isWorkerEnabled, setIsWorkerEnabled] = useState<boolean>(false);
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);

  const [reservedTables, setReservedTables] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isReservationOpen, setIsReservationOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Sync with worker toggle
  useEffect(() => {
    const fetchReservationStatus = async () => {
      const res = await axios.get(`${apiUrl}/get_reservation_status`);
      setIsWorkerEnabled(res.data.reservation_enabled === 1);
    };

    fetchReservationStatus();

    const onFocus = () => fetchReservationStatus();
    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, [apiUrl]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("email");
    const storedFname = sessionStorage.getItem("fname");
    const storedLname = sessionStorage.getItem("lname");
    const storedPhone = sessionStorage.getItem("phone");
    const storedUserId = sessionStorage.getItem("user_id");

    if (storedEmail && storedUserId) {
      setEmail(storedEmail);
      setFullName(`${storedFname} ${storedLname}`);
      setPhone(storedPhone || "");
      setIsAuthenticated(true);

      const termsAccepted = sessionStorage.getItem(
        "reservation_terms_accepted",
      );

      if (!termsAccepted) {
        setIsTermsModalVisible(true);
      }
    }

    const today = new Date();
    setReservationDate(today.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReservedTables();
    }
  }, [isAuthenticated]);

  // Open 8:00 AM → 12:59 AM, closed 1:00 AM → 7:59 AM (Asia/Manila)
  useEffect(() => {
    const checkReservationTime = () => {
      const now = dayjs().tz("Asia/Manila");
      const hour = now.hour();
      setIsReservationOpen(hour >= 8 || hour < 1);
      setLoading(false);
    };

    checkReservationTime();

    const onFocus = () => checkReservationTime();
    window.addEventListener("focus", onFocus);

    const onVisibilityChange = () => {
      if (!document.hidden) checkReservationTime();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const fetchReservedTables = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get_reserved_tables`);
      const reservedTableIds = response.data.map((tableId: number | string) =>
        String(tableId),
      );
      setReservedTables(reservedTableIds);
    } catch (error) {
      console.error("Error fetching reserved tables:", error);
    }
  };

  const handleTableClick = (tableName: string) => {
    const isReserved = reservedTables.includes(tableName);

    if (isReserved) {
      notification.warning({
        message: "Table Reserved",
        description: `Table ${tableName} has already been reserved.`,
        placement: "topRight",
      });
      return;
    }

    const isSelected = selectedTables.includes(tableName);
    let updatedTables;

    if (isSelected) {
      updatedTables = selectedTables.filter((t) => t !== tableName);
      setSelectedTables(updatedTables);

      notification.info({
        message:
          updatedTables.length === 0
            ? "All Tables Deselected"
            : "Table Deselected",
        description:
          updatedTables.length === 0
            ? "You deselected all tables."
            : `You deselected table ${tableName}.`,
        placement: "topRight",
      });
    } else {
      updatedTables = [...selectedTables, tableName];
      setSelectedTables(updatedTables);

      notification.success({
        message:
          updatedTables.length === 1 ? "Table Selected" : "Tables Selected",
        description:
          updatedTables.length === 1
            ? `You selected table ${tableName}.`
            : `You selected tables ${updatedTables.join(", ")}.`,
        placement: "topRight",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = sessionStorage.getItem("user_id");

    if (!isAuthenticated || !userId) {
      return notification.warning({
        message: "Login Required",
        description: "You need to log in before reserving a table.",
      });
    }

    if (
      !fullName ||
      !email ||
      !phone ||
      !reservationDate ||
      !reservationTime ||
      numOfPeople <= 0
    ) {
      return notification.warning({
        message: "Incomplete Details",
        description: "Please fill in all required fields.",
      });
    }

    if (selectedTables.length === 0) {
      return notification.warning({
        message: "Select Tables",
        description: "Please select at least one table.",
      });
    }

    setSubmitting(true);
    try {
      // 1. Add reservation
      const reservationResponse = await axios.post(
        `${apiUrl}/add_reservation/${userId}`,
        {
          full_name: fullName,
          email,
          pnum: phone,
          reservation_date: reservationDate,
          reservation_time: reservationTime,
          num_of_people: numOfPeople,
          special_request: notes,
          table_ids: selectedTables,
        },
      );

      const reserveId = reservationResponse.data.reserveId;

      // 2. Update most reserved
      await Promise.all(
        selectedTables.map((tableId) =>
          axios.post(`${apiUrl}/most_reserve`, {
            table_id: tableId,
            reservation_date: reservationDate,
          }),
        ),
      );

      // 3. Add activity
      await axios.post(`${apiUrl}/reservation_activity/${userId}`, {
        reservation_id: reserveId,
        activity_date: reservationDate,
      });

      // 4. Fetch latest data
      await fetchReservedTables();

      // 5. Clear
      setSelectedTables([]);
      setReservationDate(new Date().toISOString().split("T")[0]);
      setReservationTime("");
      setNumOfPeople(0);
      setNotes("");

      notification.success({
        message: "Reservation Added",
        description: "Your reservation has been added successfully.",
      });
    } catch (err: any) {
      console.error(
        "Error during reservation:",
        err.response?.data || err.message,
      );

      notification.error({
        message: "Error",
        description:
          err.response?.data?.error ||
          "Failed to add reservation. Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalSeats = useMemo(
    () =>
      tables
        .filter((t) => selectedTables.includes(t.tableName))
        .reduce((sum, t) => sum + t.capacity, 0),
    [selectedTables],
  );

  const availableCount = tables.filter(
    (t) => !reservedTables.includes(t.tableName),
  ).length;

  const needsMoreSeats =
    numOfPeople > 0 && totalSeats > 0 && totalSeats < numOfPeople;

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <Spin size="large" />
        <p className="font-core mt-4 text-slate-500">
          Checking reservation status...
        </p>
      </div>
    );
  }

  // Outside operating hours
  if (!isReservationOpen) {
    return <ReservationClose />;
  }

  // Worker disabled reservations
  if (!isWorkerEnabled) {
    return <ReservationDisableEnable />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Ambient glow + grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 40% at 15% 0%, rgba(249,115,22,0.16), transparent 70%)," +
            "radial-gradient(50% 40% at 90% 20%, rgba(56,189,248,0.12), transparent 70%)," +
            "linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)",
          backgroundSize: "auto, auto, 44px 44px, 44px 44px",
        }}
      />

      <ReservationTermsConditionModal
        visible={isTermsModalVisible}
        onClose={() => setIsTermsModalVisible(false)}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <h1 className="font-core text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              Reserve your table
            </h1>
            <p className="font-core mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
              Pick a date and time, choose one or more open tables, and confirm.
              Reserved tables are locked.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:self-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-core text-sm text-slate-700">
              {availableCount} of {tables.length} tables open
            </span>
          </div>
        </motion.header>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Floor / tables */}
          <section className="flex-1">
            {/* Legend */}
            <div className="mb-4 flex flex-wrap items-center gap-5 text-xs text-slate-600">
              <span className="font-core flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                Available
              </span>
              <span className="font-core flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                Your selection
              </span>
              <span className="font-core flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-300" />
                Reserved
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {tables.map((table, i) => {
                const isReserved = reservedTables.includes(table.tableName);
                const isSelected = selectedTables.includes(table.tableName);

                return (
                  <motion.button
                    type="button"
                    key={table.reservation_id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.35 }}
                    whileTap={isReserved ? undefined : { scale: 0.97 }}
                    onClick={() => handleTableClick(table.tableName)}
                    aria-pressed={isSelected}
                    aria-disabled={isReserved}
                    aria-label={`Table ${table.tableName}, ${table.capacity} seats, ${
                      isReserved
                        ? "reserved"
                        : isSelected
                          ? "selected"
                          : "available"
                    }`}
                    className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border text-left outline-none transition-shadow duration-300
                      focus-visible:ring-4 focus-visible:ring-orange-400/50
                      ${
                        isReserved
                          ? "cursor-not-allowed border-slate-200"
                          : isSelected
                            ? "border-orange-500 shadow-[0_0_0_1px_rgba(249,115,22,0.9),0_12px_36px_rgba(249,115,22,0.3)]"
                            : "border-emerald-300 bg-white shadow-sm hover:border-emerald-400 hover:shadow-[0_12px_28px_rgba(16,185,129,0.2)]"
                      }`}
                  >
                    <img
                      src={table.img}
                      alt=""
                      className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${
                        isReserved
                          ? "scale-100 opacity-50 grayscale"
                          : "group-hover:scale-105"
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />

                    {/* Status pill */}
                    <div className="absolute right-2 top-2">
                      <span
                        className={`font-core rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur ${
                          isReserved
                            ? "border-slate-200 bg-white/90 text-slate-500"
                            : isSelected
                              ? "border-orange-300 bg-orange-100 text-orange-700"
                              : "border-emerald-300 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {isReserved
                          ? "Reserved"
                          : isSelected
                            ? "Selected"
                            : "Open"}
                      </span>
                    </div>

                    {/* Check mark */}
                    <AnimatePresence>
                      {!isReserved && isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -90, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 15,
                          }}
                          className="absolute left-2 top-2"
                        >
                          <BsCheck2Circle className="text-3xl text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Label */}
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
                      <span className="font-core text-lg font-semibold text-slate-900">
                        Table {table.tableName}
                      </span>
                      <span className="font-core flex items-center gap-1.5 text-xs text-slate-600">
                        <BsPeople /> {table.capacity} seats
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="h-fit w-full space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6 lg:sticky lg:top-6 lg:w-[400px]"
          >
            <h2 className="font-core text-lg font-semibold text-slate-900">
              Your details
            </h2>

            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Juan Dela Cruz"
                className={fieldClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  className={fieldClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone number
                </label>
                <input
                  id="phone"
                  type="text"
                  placeholder="09xx xxx xxxx"
                  className={fieldClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className={labelClass}>
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  className={fieldClass}
                  value={reservationDate}
                  onChange={(e) => setReservationDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="time" className={labelClass}>
                  Time
                </label>
                <input
                  id="time"
                  type="time"
                  className={fieldClass}
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Guests stepper */}
            <div>
              <label htmlFor="guests" className={labelClass}>
                Number of guests
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5">
                <button
                  type="button"
                  aria-label="Decrease guests"
                  onClick={() => setNumOfPeople((n) => Math.max(0, n - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xl text-slate-700 transition hover:bg-slate-200 focus-visible:ring-4 focus-visible:ring-orange-500/30 outline-none"
                >
                  <BsDash />
                </button>
                <input
                  id="guests"
                  type="number"
                  min={0}
                  value={numOfPeople === 0 ? "" : numOfPeople}
                  placeholder="0"
                  onChange={(e) =>
                    setNumOfPeople(Math.max(0, Number(e.target.value)))
                  }
                  className="font-core h-10 w-full flex-1 bg-transparent text-center text-lg font-semibold text-slate-900 outline-none placeholder:text-slate-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  required
                />
                <button
                  type="button"
                  aria-label="Increase guests"
                  onClick={() => setNumOfPeople((n) => n + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xl text-slate-700 transition hover:bg-slate-200 focus-visible:ring-4 focus-visible:ring-orange-500/30 outline-none"
                >
                  <BsPlus />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className={labelClass}>
                Notes (optional)
              </label>
              <textarea
                id="notes"
                placeholder="Birthday setup, allergies, high chair..."
                className={`${fieldClass} resize-none`}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Live summary */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-core text-xs text-slate-500">
                  Selected tables
                </span>
                <span className="font-core text-xs text-slate-500">
                  {totalSeats} seats
                </span>
              </div>
              <div className="mt-2 flex min-h-[28px] flex-wrap gap-2">
                <AnimatePresence initial={false}>
                  {selectedTables.length === 0 ? (
                    <motion.span
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-core text-sm text-slate-400"
                    >
                      Tap a table to add it.
                    </motion.span>
                  ) : (
                    selectedTables.map((t) => (
                      <motion.span
                        key={t}
                        layout
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        className="font-core rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-sm text-orange-700"
                      >
                        Table {t}
                      </motion.span>
                    ))
                  )}
                </AnimatePresence>
              </div>
              {needsMoreSeats && (
                <p className="font-core mt-3 text-xs text-amber-600">
                  {numOfPeople} guests, but your tables seat {totalSeats}. Add
                  another table so everyone fits.
                </p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={submitting ? undefined : { scale: 1.02 }}
              whileTap={submitting ? undefined : { scale: 0.98 }}
              className="font-core w-full rounded-xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-400 py-3.5 font-bold text-white shadow-[0_8px_24px_rgba(249,115,22,0.35)] outline-none transition focus-visible:ring-4 focus-visible:ring-orange-300/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Reserving..." : "Reserve table"}
            </motion.button>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default Reservation;
