# AWS deployment foundation

`template.yaml` creates the public architecture described in the project document:

- private, versioned S3 bucket for the Vite build;
- CloudFront Origin Access Control for S3;
- API Gateway HTTP API and one Node.js 24 Lambda;
- CloudFront `/api/*` routing to the API with caching disabled;
- SPA 403/404 fallback to `index.html`.

Build the repository before packaging the stack. After deployment, upload the contents of `frontend/dist/` to the `StaticSiteBucketName` output and invalidate `/*` on the `SiteDistribution`. The template intentionally uses the CloudFront default domain first; add ACM and a custom domain only after the course AWS account/domain convention is confirmed.

The `MapboxServerToken` parameter is marked `NoEcho`, but a production deployment should source it from the team's approved AWS secret mechanism rather than command history.
