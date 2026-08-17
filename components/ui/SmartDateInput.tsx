"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar, X } from "lucide-react";

interface SmartDateInputProps {
  value: string; // ISO format "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function SmartDateInput({
  value,
  onChange,
  className = "",
  disabled = false,
}: SmartDateInputProps) {
  // 分解為年、月、日內部狀態
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  const yearRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const nativePickerRef = useRef<HTMLInputElement>(null);

  // 當外部傳入的 value 改變時同步內部狀態
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-");
      setYear(y || "");
      setMonth(m || "");
      setDay(d || "");
    } else if (!value) {
      setYear("");
      setMonth("");
      setDay("");
    }
  }, [value]);

  // 更新並向外回傳完整的 YYYY-MM-DD
  const triggerChange = (newY: string, newM: string, newD: string) => {
    if (newY && newM && newD && newY.length === 4 && newM.length > 0 && newD.length > 0) {
      const paddedM = newM.padStart(2, "0");
      const paddedD = newD.padStart(2, "0");
      onChange(`${newY}-${paddedM}-${paddedD}`);
    } else if (!newY && !newM && !newD) {
      onChange("");
    }
  };

  // 年份變更處理：限制 4 位數字，滿 4 位自動跳轉至月份
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 4) {
      setYear(raw);
      triggerChange(raw, month, day);
      if (raw.length === 4) {
        monthRef.current?.focus();
        monthRef.current?.select();
      }
    }
  };

  // 月份變更處理：限制 2 位數字 (1-12)，滿 2 位自動跳轉至日期
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 2) {
      const num = parseInt(raw, 10);
      if (raw.length === 1 && num > 1) {
        // 如果輸入 2~9，自動補 0 為 02~09 並直接跳到日期
        raw = "0" + raw;
        setMonth(raw);
        triggerChange(year, raw, day);
        dayRef.current?.focus();
        dayRef.current?.select();
        return;
      }
      if (raw.length === 2 && num > 12) {
        raw = "12";
      }
      setMonth(raw);
      triggerChange(year, raw, day);
      if (raw.length === 2) {
        dayRef.current?.focus();
        dayRef.current?.select();
      }
    }
  };

  // 日期變更處理：限制 2 位數字 (1-31)
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 2) {
      const num = parseInt(raw, 10);
      if (raw.length === 1 && num > 3) {
        // 如果輸入 4~9，自動補 0 為 04~09
        raw = "0" + raw;
      }
      if (raw.length === 2 && num > 31) {
        raw = "31";
      }
      setDay(raw);
      triggerChange(year, month, raw);
    }
  };

  // 按鍵退格與鍵盤導引
  const handleKeyDown = (
    field: "year" | "month" | "day",
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (field === "month" && month === "") {
        yearRef.current?.focus();
      } else if (field === "day" && day === "") {
        monthRef.current?.focus();
      }
    } else if (e.key === "ArrowRight") {
      if (field === "year" && (e.currentTarget.selectionStart === year.length || year.length === 4)) {
        monthRef.current?.focus();
      } else if (field === "month" && (e.currentTarget.selectionStart === month.length || month.length === 2)) {
        dayRef.current?.focus();
      }
    } else if (e.key === "ArrowLeft") {
      if (field === "month" && e.currentTarget.selectionStart === 0) {
        yearRef.current?.focus();
      } else if (field === "day" && e.currentTarget.selectionStart === 0) {
        monthRef.current?.focus();
      }
    }
  };

  // 支援整段貼上 (例如 2024-08-18, 2024/08/18, 20240818)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    const match = pasteData.match(/^(\d{4})[-/.]?(\d{1,2})[-/.]?(\d{1,2})$/);
    if (match) {
      const y = match[1];
      const m = match[2].padStart(2, "0");
      const d = match[3].padStart(2, "0");
      setYear(y);
      setMonth(m);
      setDay(d);
      onChange(`${y}-${m}-${d}`);
      dayRef.current?.focus();
    }
  };

  // 清除按鈕
  const handleClear = () => {
    setYear("");
    setMonth("");
    setDay("");
    onChange("");
    yearRef.current?.focus();
  };

  // 原生日曆選取器連動
  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const [y, m, d] = val.split("-");
      setYear(y || "");
      setMonth(m || "");
      setDay(d || "");
      onChange(val);
    }
  };

  const hasValue = !!(year || month || day);

  return (
    <div
      className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all text-xs ${className}`}
    >
      {/* 年 - 月 - 日 輸入區 */}
      <div className="flex items-center gap-1 font-mono text-zinc-100">
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={year}
          placeholder="YYYY"
          disabled={disabled}
          onChange={handleYearChange}
          onKeyDown={(e) => handleKeyDown("year", e)}
          onPaste={handlePaste}
          className="w-12 bg-transparent text-center placeholder-zinc-500 text-amber-300 font-semibold focus:outline-none"
          title="西元年份 (4位數，輸入完成自動跳至月份)"
        />
        <span className="text-zinc-500 select-none font-bold">/</span>
        <input
          ref={monthRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={month}
          placeholder="MM"
          disabled={disabled}
          onChange={handleMonthChange}
          onKeyDown={(e) => handleKeyDown("month", e)}
          onPaste={handlePaste}
          className="w-8 bg-transparent text-center placeholder-zinc-500 text-amber-300 font-semibold focus:outline-none"
          title="月份 (2位數，輸入完成自動跳至日期)"
        />
        <span className="text-zinc-500 select-none font-bold">/</span>
        <input
          ref={dayRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={day}
          placeholder="DD"
          disabled={disabled}
          onChange={handleDayChange}
          onKeyDown={(e) => handleKeyDown("day", e)}
          onPaste={handlePaste}
          className="w-8 bg-transparent text-center placeholder-zinc-500 text-amber-300 font-semibold focus:outline-none"
          title="日期 (2位數)"
        />
      </div>

      {/* 右側按鈕區：清除與日曆圖示 */}
      <div className="flex items-center gap-1.5 ml-2">
        {hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-white/10 transition-colors cursor-pointer"
            title="清除日期"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* 原生日曆選擇彈窗觸發器 */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => {
              if (nativePickerRef.current) {
                if ("showPicker" in HTMLInputElement.prototype) {
                  nativePickerRef.current.showPicker();
                } else {
                  nativePickerRef.current.focus();
                }
              }
            }}
            disabled={disabled}
            className="p-1 text-zinc-400 hover:text-amber-400 rounded hover:bg-white/10 transition-colors cursor-pointer"
            title="開啟日曆選擇器"
          >
            <Calendar className="w-4 h-4" />
          </button>

          <input
            ref={nativePickerRef}
            type="date"
            value={value || ""}
            onChange={handleNativePickerChange}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
