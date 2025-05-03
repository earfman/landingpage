# ZeroTrustKerberosLink Landing Page

This is a modern, responsive landing page for ZeroTrustKerberosLink with comprehensive documentation.

## Project Structure

- `index.html` - The main landing page HTML file
- `documentation.html` - The main documentation page with anchor links to different sections
- `styles.css` - CSS styles for the landing page
- `script.js` - JavaScript for interactive elements
- `images/` - Directory containing images used in the landing page
- `docs/` - Source markdown files for the documentation
- `site/` - Generated HTML documentation (built from the `docs/` directory using MkDocs)
  - `site/implementation-guide/` - Implementation guide documentation
  - `site/security-hardening/` - Security hardening documentation
  - `site/security-hardening/security-testing/` - Security testing framework documentation

## Deployment Configuration

This project is deployed on Netlify with automatic deployments from GitHub. The deployment configuration is defined in `netlify.toml`.

### Netlify Deployment Process

1. Changes are pushed to the GitHub repository at https://github.com/earfman/landingpage.git
2. Netlify automatically detects the changes and starts a new build
3. The build process installs MkDocs and its dependencies, then runs `mkdocs build` to generate the documentation site
4. Netlify deploys the contents of the `site` directory to zerotrustkerberoslink.com

### Key Netlify Configuration

- **Build Command**: `pip install mkdocs mkdocs-material pymdown-extensions mkdocs-minify-plugin mkdocs-git-revision-date-localized-plugin && mkdocs build`
- **Publish Directory**: `site`
- **Security Headers**: Various security headers are configured in `netlify.toml` to enhance the security of the site

## Documentation Structure

The documentation is built using MkDocs, a static site generator designed for building documentation websites.

### Source Files

- `docs/` - Contains all the markdown source files for the documentation
- `mkdocs.yml` - Configuration file for MkDocs that defines the structure and appearance of the documentation site

### Generated Files

- `site/` - Contains the generated HTML documentation (this directory is in `.gitignore` and not committed to the repository)

### Documentation Sections

- **Implementation Guide**: Comprehensive guide for deploying ZeroTrustKerberosLink
- **Security Hardening**: Documentation on security features and hardening practices
- **Security Testing Framework**: Framework for testing the security of ZeroTrustKerberosLink deployments
- **Compliance Verification**: Guides for verifying compliance with various standards

## Local Development

To work on the documentation locally:

1. Install MkDocs and required plugins:
   ```
   pip install mkdocs mkdocs-material pymdown-extensions mkdocs-minify-plugin mkdocs-git-revision-date-localized-plugin
   ```

2. Run the local development server:
   ```
   mkdocs serve
   ```

3. View the documentation at http://localhost:8000

4. Build the documentation:
   ```
   mkdocs build
   ```

## Deploying to Amazon S3

Follow these steps to deploy the landing page to Amazon S3:

### 1. Create an S3 Bucket

1. Sign in to the AWS Management Console and open the [Amazon S3 console](https://console.aws.amazon.com/s3/)
2. Choose **Create bucket**
3. Enter a bucket name (e.g., `zerotrustkerberoslink-landing`)
4. Select the AWS Region where you want to create the bucket
5. Uncheck **Block all public access** (since this will be a public website)
6. Acknowledge that the bucket will be public
7. Choose **Create bucket**

### 2. Configure the Bucket for Static Website Hosting

1. Select your new bucket from the list
2. Choose the **Properties** tab
3. Scroll down to **Static website hosting** and choose **Edit**
4. Select **Enable**
5. For **Index document**, enter `index.html`
6. For **Error document**, enter `index.html`
7. Choose **Save changes**

### 3. Set Bucket Policy for Public Access

1. Select the **Permissions** tab
2. Under **Bucket policy**, choose **Edit**
3. Enter the following policy (replace `YOUR-BUCKET-NAME` with your actual bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

4. Choose **Save changes**

### 4. Upload the Landing Page Files

1. Select the **Objects** tab
2. Choose **Upload**
3. Add all the files and folders from this landing page directory
4. Choose **Upload**

### 5. Access Your Website

1. Return to the **Properties** tab
2. Scroll down to **Static website hosting**
3. Note the **Bucket website endpoint** URL - this is the address of your new landing page

## Customizing the Landing Page

To customize the landing page:

1. Replace the placeholder content in `index.html` with your specific messaging
2. Update the colors in `styles.css` by modifying the CSS variables at the top of the file
3. Replace the `hero-image.svg` with your own custom graphics
4. Update the contact form in `script.js` to submit to your backend if needed

## Additional S3 Website Features to Consider

- **Custom Domain**: Set up a custom domain for your landing page using Amazon Route 53
- **HTTPS**: Enable HTTPS by using Amazon CloudFront with your S3 bucket
- **Monitoring**: Set up Amazon CloudWatch to monitor access to your landing page
- **Backup**: Configure versioning on your S3 bucket to maintain backups of your landing page

## Support

For any questions or issues, contact: zerotrustkerberoslink@gmail.com
