import * as Sentry from '@sentry/node';
import { ConfigService } from '../config/config.service';

/**
 * Sentry APM Configuration
 * Initializes Sentry for error tracking and performance monitoring
 */
export function initializeSentry(configService: ConfigService) {
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn) {
    console.log('⚠️  Sentry DSN not configured - APM disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: configService.nodeEnv,

    // Performance Monitoring
    tracesSampleRate: configService.isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Integrations
    integrations: [
      // HTTP tracing
      new Sentry.Integrations.Http({ tracing: true }),

      // Express integration
      new Sentry.Integrations.Express({
        app: undefined, // Will be set later
      }),
    ],

    // Before send hook to filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data) {
            delete breadcrumb.data.password;
            delete breadcrumb.data.token;
            delete breadcrumb.data.apiKey;
          }
          return breadcrumb;
        });
      }

      return event;
    },
  });

  console.log('✅ Sentry APM initialized');
}

/**
 * Track custom metrics
 */
export function trackMetric(name: string, value: number, tags?: Record<string, string>) {
  Sentry.metrics.gauge(name, value, { tags });
}

/**
 * Track custom events
 */
export function trackEvent(
  name: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info',
) {
  Sentry.captureMessage(name, {
    level,
    extra: data,
  });
}
