# ZeroTrustKerberosLink Landing Page

This is a modern, responsive landing page for ZeroTrustKerberosLink that can be hosted on Amazon S3.

## Files Structure

- `index.html` - The main HTML file
- `styles.css` - CSS styles for the landing page
- `script.js` - JavaScript for interactive elements
- `images/` - Directory containing images used in the landing page
  - `hero-image.svg` - SVG illustration for the hero section

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
