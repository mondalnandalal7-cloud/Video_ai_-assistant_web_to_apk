import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  X,
  Share2,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, installPWA } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'webapk' | 'pwabuilder' | 'cli'>('webapk');

  if (!isOpen) return null;

  // Use the public shared or origin URL
  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-qojv362534q5r3jfwwat5t-754630542797.asia-east1.run.app';
  const pwabuilderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(currentAppUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div
      id="android-apk-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="android-apk-modal-content"
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-700/80 bg-[#0E131F] shadow-2xl shadow-indigo-950/40 text-slate-100 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-[#111726]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Android Phone & APK Center</h3>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
                  Android Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">Install native WebAPK or download signed .apk package</p>
            </div>
          </div>
          <button
            id="close-android-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 pt-3 gap-2">
          <button
            id="tab-webapk"
            onClick={() => setActiveTab('webapk')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'webapk'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-4 w-4" />
            Direct Install (WebAPK)
          </button>
          <button
            id="tab-pwabuilder"
            onClick={() => setActiveTab('pwabuilder')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'pwabuilder'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="h-4 w-4" />
            1-Click .APK Generator
          </button>
          <button
            id="tab-cli"
            onClick={() => setActiveTab('cli')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'cli'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-4 w-4" />
            CLI / Bubblewrap
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: WEBAPK DIRECT INSTALLATION */}
          {activeTab === 'webapk' && (
            <div className="space-y-5">
              {/* Android Native WebAPK Explanation */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-emerald-300">
                      What is Android WebAPK?
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      On Android devices (Chrome, Samsung Internet, Edge), installing this Progressive Web App triggers Google&apos;s WebAPK minting service. Android automatically creates a <strong className="text-emerald-400">genuine native .apk</strong>, registers it in the Android Package Manager, and places the app icon right on your phone home screen and app drawer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Install Action Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="/pwa-192x192.png"
                      alt="App Icon"
                      className="h-12 w-12 rounded-xl shadow-md border border-slate-700/60"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-semibold text-white">AI Studio Faceless Video</h4>
                      <p className="text-xs text-slate-400">Package ID: faceless.ai.studio.app (v1.0.0)</p>
                    </div>
                  </div>
                  {isInstalled && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Installed
                    </span>
                  )}
                </div>

                {/* Primary Action Button */}
                {isInstallable ? (
                  <button
                    id="trigger-webapk-install-btn"
                    onClick={installPWA}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all"
                  >
                    <Smartphone className="h-4 w-4" />
                    Install App on this Android Device (WebAPK)
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 font-medium">
                      To install on your Android phone:
                    </p>
                    <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5 pl-1">
                      <li>Open this app in <strong className="text-slate-200">Chrome</strong> or <strong className="text-slate-200">Samsung Internet</strong> on your phone.</li>
                      <li>Tap the browser menu <strong className="text-slate-200">(⋮ or ☰)</strong>.</li>
                      <li>Select <strong className="text-emerald-400">&quot;Install App&quot;</strong> or <strong className="text-emerald-400">&quot;Add to Home screen&quot;</strong>.</li>
                      <li>Android will generate the APK and add the icon to your home screen!</li>
                    </ol>
                  </div>
                )}

                {/* URL Bar with Copy */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Open on your Android phone
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#080B11] px-3 py-2">
                    <input
                      type="text"
                      readOnly
                      value={currentAppUrl}
                      className="w-full bg-transparent text-xs text-slate-300 outline-none font-mono selection:bg-indigo-500/30"
                    />
                    <button
                      id="copy-apk-url-btn"
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 shrink-0 transition-colors"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PWABUILDER 1-CLICK APK FILE GENERATION */}
          {activeTab === 'pwabuilder' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                  <Download className="h-4 w-4 text-indigo-400" />
                  Generate Downloadable .APK &amp; .AAB Package via PWABuilder
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  PWABuilder is the official open-source tool backed by Microsoft and Google to package Progressive Web Apps into standalone Android APK packages for direct sideloading or Google Play Store release.
                </p>
              </div>

              {/* Status Checklist */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Android APK Package Readiness Checklist
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="text-slate-300">Web App Manifest configured</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="text-slate-300">192px &amp; 512px PNG icons built</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="text-slate-300">Maskable adaptive icon included</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="text-slate-300">Offline Service Worker active</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="text-slate-300">Standalone display &amp; portrait lock</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="text-slate-300">HTTPS Security &amp; origin valid</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="space-y-3">
                <a
                  id="open-pwabuilder-apk-btn"
                  href={pwabuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition-all text-center"
                >
                  <ExternalLink className="h-4 w-4" />
                  Launch PWABuilder with this App URL (Download .APK)
                </a>
                <p className="text-[11px] text-center text-slate-400">
                  On PWABuilder, simply click <strong>&quot;Package for Android&quot;</strong> → <strong>&quot;Generate APK&quot;</strong> to get your signed APK file directly.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CLI / BUBBLEWRAP BUILD GUIDE */}
          {activeTab === 'cli' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                If you have a terminal on your computer, you can build a native Android APK directly using Google&apos;s official <strong>Bubblewrap CLI</strong>:
              </p>

              <div className="rounded-xl border border-slate-800 bg-[#080B11] p-4 font-mono text-xs space-y-2 text-slate-300">
                <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1 border-b border-slate-800">
                  <span>TERMINAL COMMANDS</span>
                  <span>Google Bubblewrap</span>
                </div>
                <p className="text-emerald-400"># 1. Initialize Android project from PWA Manifest</p>
                <p className="text-indigo-300 bg-slate-900/90 p-2 rounded select-all">
                  npx @bubblewrap/cli init --manifest={currentAppUrl}/manifest.webmanifest
                </p>
                <p className="text-emerald-400 mt-2"># 2. Compile signed release APK</p>
                <p className="text-indigo-300 bg-slate-900/90 p-2 rounded select-all">
                  npx @bubblewrap/cli build
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Output:</p>
                <p>Generates <code className="text-emerald-400 font-mono">app-release-signed.apk</code> ready to be transferred to your phone via USB or downloaded directly.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#111726] px-6 py-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Standard Android PWA / WebAPK specification</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
