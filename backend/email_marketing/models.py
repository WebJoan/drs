from django.db import models
from person.models import Person
from core.mixins import TimestampsMixin
from django.utils.translation import gettext_lazy as _
from django_softdelete.models import SoftDeleteModel


class AiEmail(SoftDeleteModel, TimestampsMixin):
    STATUS_CHOICES = [
        ('draft', _('Черновик')),
        ('sent', _('Отправлено')),
        ('delivered', _('Доставлено')),
        ('error', _('Ошибка')),
        ('archived', _('Архив')),
    ]

    sales_manager = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'sales'},
        related_name='ai_emails',
        verbose_name=_('Ответственный менеджер'),
        help_text=_('Sales менеджер от имени которого отправляется письмо')
    )
    subject = models.CharField(max_length=255)
    recipient = models.ForeignKey(Person, on_delete=models.CASCADE)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    def __str__(self):
        return self.subject

    def get_attachments(self):
        return self.attachments.all()
    
    class Meta:
        verbose_name = _('Письмо AI')
        verbose_name_plural = _('Письма AI')


class AiEmailAttachment(SoftDeleteModel, TimestampsMixin):
    ai_email = models.ForeignKey(
        AiEmail,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name=_('Письмо')
    )
    file = models.FileField(upload_to='ai_email_attachments/', verbose_name=_('Файл'))
    name = models.CharField(max_length=255, verbose_name=_('Имя файла'), blank=True)

    def __str__(self):
        return self.name or self.file.name

    class Meta:
        verbose_name = _('Файл письма AI')
        verbose_name_plural = _('Файлы письма AI')

