import {useEffect, useRef, useState, type FormEvent} from 'react';
import {m, useScroll, useTransform} from 'motion/react';
import {ArrowUpRight, Check, Copy, Mail, RotateCcw} from 'lucide-react';
import {CONTACT_CONFIG} from '@/src/data/profile';
import {useMagnetic} from '@/src/hooks/useMagnetic';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';
import {HairlineRule, MaskedReveal} from '@/src/components/motion/ScrollPrimitives';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormValues {
  name: string;
  email: string;
  topic: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

interface PreparedInquiry {
  subject: string;
  body: string;
  mailtoHref: string | null;
}

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const trimmedName = values.name.trim();
  const trimmedEmail = values.email.trim();
  const trimmedMessage = values.message.trim();

  if (trimmedName.length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  }

  if (!trimmedEmail) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (trimmedMessage.length < 12) {
    errors.message =
      'Please share brief project or opportunity details (at least 12 characters).';
  }

  return errors;
}

function buildPreparedInquiry(values: FormValues): PreparedInquiry {
  const trimmedName = values.name.trim();
  const trimmedEmail = values.email.trim();
  const trimmedMessage = values.message.trim();

  const subject = `[${values.topic}] Inquiry from ${trimmedName}`;
  const body = [
    `Topic: ${values.topic}`,
    `Name: ${trimmedName}`,
    `Reply Email: ${trimmedEmail}`,
    '',
    'Project / Opportunity Details:',
    trimmedMessage,
  ].join('\n');

  const mailtoHref = CONTACT_CONFIG.email
    ? `mailto:${encodeURIComponent(CONTACT_CONFIG.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

  return {subject, body, mailtoHref};
}

export function ContactSection() {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const submitButtonRef = useMagnetic<HTMLButtonElement>({strength: 5});

  const {scrollYProgress} = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const leftY = useTransform(scrollYProgress, [0, 0.5, 1], [18, 0, -10]);
  const formY = useTransform(scrollYProgress, [0, 0.5, 1], [28, 0, -16]);
  const formScale = useTransform(
    scrollYProgress,
    [0, 0.24, 0.78, 1],
    [0.975, 1, 1, 0.985],
  );
  const footerThresholdScaleY = useTransform(
    scrollYProgress,
    [0.74, 0.98],
    [0, 1],
  );

  const [values, setValues] = useState<FormValues>({
    name: '',
    email: '',
    topic: CONTACT_CONFIG.inquiryTopics[0] ?? 'Freelance Project',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepared, setPrepared] = useState<PreparedInquiry | null>(null);
  const [copiedTarget, setCopiedTarget] = useState<'email' | 'inquiry' | null>(
    null,
  );
  const [clipboardFeedback, setClipboardFeedback] = useState<string | null>(
    null,
  );

  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const submitGuardTimerRef = useRef<number | null>(null);
  const copyFeedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (submitGuardTimerRef.current !== null) {
        window.clearTimeout(submitGuardTimerRef.current);
      }
      if (copyFeedbackTimerRef.current !== null) {
        window.clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

  const copyText = async (text: string, target: 'email' | 'inquiry') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(target);
      setClipboardFeedback(
        target === 'email'
          ? 'Email address copied to clipboard.'
          : 'Formatted inquiry copied to clipboard.',
      );
    } catch {
      setClipboardFeedback(
        'Clipboard access is unavailable in this browser context. Please copy manually.',
      );
    }

    if (copyFeedbackTimerRef.current !== null) {
      window.clearTimeout(copyFeedbackTimerRef.current);
    }
    copyFeedbackTimerRef.current = window.setTimeout(() => {
      setCopiedTarget(null);
    }, 2400);
  };

  const handleFieldChange = (field: keyof FormValues, nextValue: string) => {
    setValues((prev) => ({...prev, [field]: nextValue}));
    if (field === 'name' || field === 'email' || field === 'message') {
      setErrors((prev) => {
        if (!prev[field]) {
          return prev;
        }
        const nextErrors = {...prev};
        delete nextErrors[field];
        return nextErrors;
      });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPreparing) {
      return;
    }

    const nextErrors = validateForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setPrepared(null);

      if (nextErrors.name) {
        nameRef.current?.focus();
      } else if (nextErrors.email) {
        emailRef.current?.focus();
      } else if (nextErrors.message) {
        messageRef.current?.focus();
      }
      return;
    }

    setErrors({});
    setIsPreparing(true);

    const nextPrepared = buildPreparedInquiry(values);
    setPrepared(nextPrepared);

    if (nextPrepared.mailtoHref) {
      window.location.href = nextPrepared.mailtoHref;
    }

    if (submitGuardTimerRef.current !== null) {
      window.clearTimeout(submitGuardTimerRef.current);
    }
    submitGuardTimerRef.current = window.setTimeout(() => {
      setIsPreparing(false);
    }, 650);
  };

  const handleReset = () => {
    setValues({
      name: '',
      email: '',
      topic: CONTACT_CONFIG.inquiryTopics[0] ?? 'Freelance Project',
      message: '',
    });
    setErrors({});
    setPrepared(null);
    setClipboardFeedback(null);
    nameRef.current?.focus();
  };

  const hasConfiguredEmail = Boolean(CONTACT_CONFIG.email);

  return (
    <section
      ref={sectionRef}
      id="contact"
      data-nav-surface="light"
      aria-labelledby="contact-heading"
      className="relative scroll-mt-24 overflow-x-clip border-t border-[var(--border-hairline)] bg-surface pt-20 pb-24 sm:pt-28 sm:pb-32 lg:pt-32 lg:pb-36"
    >
      <div className="mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Direct Channels & Transparency */}
          <m.div
            style={prefersReducedMotion ? undefined : {y: leftY}}
            className="lg:col-span-5"
          >
            <MaskedReveal delay={0.02}>
              <p className="text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">
                Contact
              </p>
            </MaskedReveal>
            <h2
              id="contact-heading"
              className="mt-3 max-w-[16ch] text-[clamp(1.95rem,3.8vw,3.15rem)] leading-[1.08] font-semibold tracking-[var(--tracking-heading)] text-ink"
            >
              <MaskedReveal delay={0.08}>
                <span>Start a conversation</span>
              </MaskedReveal>
              <MaskedReveal delay={0.14}>
                <span className="font-serif block pt-0.5 font-medium italic text-ink">
                  about your next build.
                </span>
              </MaskedReveal>
            </h2>

            <p className="mt-5 max-w-[44ch] text-sm leading-[1.68] text-ink-secondary sm:text-[15px]">
              Open to freelance software development engagements, web
              application work, and engineering roles.
            </p>

            <dl className="mt-8">
              <HairlineRule />
              <div className="py-4">
                <dt className="text-xs font-medium text-ink-muted">
                  Direct Email
                </dt>
                <dd className="mt-1.5">
                  {hasConfiguredEmail && CONTACT_CONFIG.email ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={`mailto:${CONTACT_CONFIG.email}`}
                          data-cursor="link"
                          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-ink underline underline-offset-4 transition-opacity hover:opacity-75"
                        >
                          <Mail className="h-4 w-4" aria-hidden="true" />
                          <span>{CONTACT_CONFIG.email}</span>
                        </a>
                        <button
                          type="button"
                          data-cursor="button"
                          onClick={() =>
                            copyText(CONTACT_CONFIG.email ?? '', 'email')
                          }
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--border-hairline-strong)] bg-canvas px-4 py-2 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-surface-subtle"
                        >
                          {copiedTarget === 'email' ? (
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>
                            {copiedTarget === 'email' ? 'Copied' : 'Copy Email'}
                          </span>
                        </button>
                      </div>
                      {copiedTarget === 'email' && clipboardFeedback && (
                        <p
                          role="status"
                          aria-live="polite"
                          className="text-xs font-medium text-ink"
                        >
                          {clipboardFeedback}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-ink">
                        Email address pending configuration
                      </p>
                      <p className="text-xs leading-[1.6] text-ink-muted">
                        Direct email handoff will activate once a confirmed
                        address is set in{' '}
                        <span className="font-medium text-ink">
                          CONTACT_CONFIG.email
                        </span>
                        .
                      </p>
                    </div>
                  )}
                </dd>
              </div>

              {CONTACT_CONFIG.socialLinks.length > 0 && (
                <>
                  <HairlineRule delay={0.08} />
                  <div className="py-4">
                    <dt className="text-xs font-medium text-ink-muted">
                      Verified Profiles
                    </dt>
                    <dd className="mt-2 flex flex-wrap items-center gap-4">
                      {CONTACT_CONFIG.socialLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-cursor="link"
                          className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-ink underline underline-offset-4 hover:opacity-75"
                        >
                          <span>{link.label}</span>
                          <ArrowUpRight
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </a>
                      ))}
                    </dd>
                  </div>
                </>
              )}

              <HairlineRule delay={0.14} />
              <div className="py-4">
                <dt className="text-xs font-medium text-ink-muted">
                  Workflow Notice
                </dt>
                <dd className="mt-1 text-xs leading-[1.65] text-ink-secondary">
                  {CONTACT_CONFIG.privacyNotice}
                </dd>
              </div>
              <HairlineRule delay={0.2} />
            </dl>
          </m.div>

          {/* Right Column: Validated Inquiry Form */}
          <m.div
            style={
              prefersReducedMotion
                ? undefined
                : {y: formY, scale: formScale}
            }
            className="lg:col-span-7"
          >
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-canvas p-6 shadow-[0_24px_60px_-32px_rgba(9,9,11,0.12)] sm:p-8 lg:p-10">
              <form
                noValidate
                onSubmit={handleSubmit}
                aria-busy={isPreparing}
                className="space-y-6"
              >
                {/* Inquiry Topic */}
                <fieldset>
                  <legend className="text-xs font-medium text-ink-muted">
                    Inquiry Focus
                  </legend>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {CONTACT_CONFIG.inquiryTopics.map((topic) => {
                      const isSelected = values.topic === topic;
                      return (
                        <button
                          key={topic}
                          type="button"
                          data-cursor="button"
                          aria-pressed={isSelected}
                          onClick={() => handleFieldChange('topic', topic)}
                          className={`min-h-[44px] shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium transition-[background-color,border-color,color] duration-[var(--duration-fast)] ${
                            isSelected
                              ? 'border-obsidian bg-obsidian text-on-dark'
                              : 'border-[var(--border-hairline-strong)] bg-canvas text-ink-secondary hover:border-ink hover:text-ink'
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Name Field */}
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-medium text-ink"
                    >
                      Name
                    </label>
                    <input
                      ref={nameRef}
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={values.name}
                      onChange={(event) =>
                        handleFieldChange('name', event.target.value)
                      }
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={
                        errors.name ? 'contact-name-error' : undefined
                      }
                      placeholder="Your name"
                      className={`mt-2 block min-h-[46px] w-full rounded-[var(--radius-sm)] border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle transition-colors focus:bg-canvas ${
                        errors.name
                          ? 'border-ink ring-1 ring-ink'
                          : 'border-[var(--border-hairline-strong)] focus:border-ink'
                      }`}
                    />
                    {errors.name && (
                      <p
                        id="contact-name-error"
                        role="alert"
                        className="mt-1.5 text-xs font-medium text-ink"
                      >
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-medium text-ink"
                    >
                      Email
                    </label>
                    <input
                      ref={emailRef}
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={values.email}
                      onChange={(event) =>
                        handleFieldChange('email', event.target.value)
                      }
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={
                        errors.email ? 'contact-email-error' : undefined
                      }
                      placeholder="you@company.com"
                      className={`mt-2 block min-h-[46px] w-full rounded-[var(--radius-sm)] border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle transition-colors focus:bg-canvas ${
                        errors.email
                          ? 'border-ink ring-1 ring-ink'
                          : 'border-[var(--border-hairline-strong)] focus:border-ink'
                      }`}
                    />
                    {errors.email && (
                      <p
                        id="contact-email-error"
                        role="alert"
                        className="mt-1.5 text-xs font-medium text-ink"
                      >
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Project Details */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-medium text-ink"
                  >
                    Project or Opportunity Details
                  </label>
                  <textarea
                    ref={messageRef}
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    value={values.message}
                    onChange={(event) =>
                      handleFieldChange('message', event.target.value)
                    }
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={
                      errors.message ? 'contact-message-error' : undefined
                    }
                    placeholder="Briefly describe the software, workflow challenge, or role you would like to discuss."
                    className={`mt-2 block w-full rounded-[var(--radius-sm)] border bg-surface px-3.5 py-3 text-sm leading-[1.6] text-ink placeholder:text-ink-subtle transition-colors focus:bg-canvas ${
                      errors.message
                        ? 'border-ink ring-1 ring-ink'
                        : 'border-[var(--border-hairline-strong)] focus:border-ink'
                    }`}
                  />
                  {errors.message && (
                    <p
                      id="contact-message-error"
                      role="alert"
                      className="mt-1.5 text-xs font-medium text-ink"
                    >
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-hairline)] pt-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      ref={submitButtonRef}
                      type="submit"
                      data-cursor="button"
                      disabled={isPreparing}
                      className="inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-obsidian px-6 py-3 text-sm font-medium text-on-dark transition-[background-color,opacity] duration-[var(--duration-fast)] ease-[var(--ease-editorial)] hover:bg-obsidian-elevated disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span>
                        {isPreparing
                          ? 'Preparing Inquiry...'
                          : hasConfiguredEmail
                            ? 'Open in Email App'
                            : 'Prepare Inquiry Summary'}
                      </span>
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </button>

                    {(prepared ||
                      values.name ||
                      values.email ||
                      values.message) && (
                      <button
                        type="button"
                        data-cursor="button"
                        onClick={handleReset}
                        className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--border-hairline-strong)] bg-canvas px-4 py-2 text-xs font-medium text-ink-secondary transition-colors hover:border-ink hover:text-ink"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-ink-muted">
                    {hasConfiguredEmail
                      ? 'Opens your default email client'
                      : 'Client-side validation & copy summary'}
                  </p>
                </div>
              </form>

              {/* Prepared / Handoff Feedback Panel */}
              {prepared && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-6 rounded-[var(--radius-md)] border border-[var(--border-hairline-strong)] bg-surface p-5"
                >
                  <p className="text-sm font-semibold text-ink">
                    {prepared.mailtoHref
                      ? 'Email draft opened in your mail client.'
                      : 'Inquiry validated and ready to copy.'}
                  </p>

                  <p className="mt-1.5 text-xs leading-[1.6] text-ink-secondary">
                    {prepared.mailtoHref
                      ? 'No server submission took place—your message was handed directly to your local email application. If it did not open, use the actions below.'
                      : 'Direct email delivery is paused because a destination address has not been configured yet. You can copy the formatted inquiry below for manual handoff once an email is added.'}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {prepared.mailtoHref && (
                      <a
                        href={prepared.mailtoHref}
                        data-cursor="button"
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-obsidian px-4 py-2 text-xs font-medium text-on-dark transition-colors hover:bg-obsidian-elevated"
                      >
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Open Email App Again</span>
                      </a>
                    )}

                    <button
                      type="button"
                      data-cursor="button"
                      onClick={() =>
                        copyText(
                          `Subject: ${prepared.subject}\n\n${prepared.body}`,
                          'inquiry',
                        )
                      }
                      className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-hairline-strong)] bg-canvas px-4 py-2 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-surface-subtle"
                    >
                      {copiedTarget === 'inquiry' ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>
                        {copiedTarget === 'inquiry'
                          ? 'Inquiry Copied'
                          : 'Copy Formatted Inquiry'}
                      </span>
                    </button>
                  </div>

                  {clipboardFeedback && (
                    <p className="mt-2.5 text-xs font-medium text-ink">
                      {clipboardFeedback}
                    </p>
                  )}
                </div>
              )}
            </div>
          </m.div>
        </div>
      </div>

      {/* Closing Obsidian Horizon preparing the Footer curtain */}
      <m.div
        aria-hidden="true"
        style={
          prefersReducedMotion
            ? undefined
            : {scaleY: footerThresholdScaleY, transformOrigin: 'bottom center'}
        }
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-obsidian sm:h-16"
      />
    </section>
  );
}
