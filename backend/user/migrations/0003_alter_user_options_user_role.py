# Generated by Django 5.2.4 on 2025-07-13 15:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0002_alter_user_managers'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='user',
            options={'ordering': ['id'], 'permissions': [('is_product_manager', 'Can manage products'), ('is_sales_manager', 'Can manage sales')]},
        ),
        migrations.AddField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('product', 'Product Manager'), ('sales', 'Sales Manager'), ('admin', 'Admin'), ('user', 'User')], default='user', help_text='User role in the system', max_length=20, verbose_name='Role'),
        ),
    ]
