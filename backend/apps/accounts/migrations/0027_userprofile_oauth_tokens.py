from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0026_usersession_model"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="github_access_token",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="github_access_token_hash",
            field=models.CharField(blank=True, db_index=True, default="", max_length=64),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="google_oauth_token",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="google_oauth_token_hash",
            field=models.CharField(blank=True, db_index=True, default="", max_length=64),
        ),
    ]
